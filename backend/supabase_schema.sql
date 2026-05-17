-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Game Sessions Table
CREATE TABLE public.game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    mode VARCHAR(20) DEFAULT 'singleplayer',
    score INTEGER DEFAULT 0,
    word_count INTEGER DEFAULT 0,
    duration INTEGER DEFAULT 0, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Game Words Table (optional, to track all words played in a session)
CREATE TABLE public.game_words (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE,
    word VARCHAR(100) NOT NULL,
    order_index INTEGER NOT NULL
);

-- Leaderboard Table
CREATE TABLE public.leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    mode VARCHAR(20) DEFAULT 'singleplayer',
    played_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Setup RLS (Row Level Security) if needed later
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Update these for real production usage)
CREATE POLICY "Public profiles are viewable by everyone." ON public.users FOR SELECT USING (true);
CREATE POLICY "Leaderboard is viewable by everyone." ON public.leaderboard FOR SELECT USING (true);

-- Dictionary Table (Hybrid Strategy)
CREATE TABLE public.dictionary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    word VARCHAR(100) UNIQUE NOT NULL,
    word_type VARCHAR(50),
    meaning TEXT NOT NULL,
    example_usage TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast lookups during gameplay
CREATE INDEX idx_dictionary_word ON public.dictionary(word);

