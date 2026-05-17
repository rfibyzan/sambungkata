import { useState, useEffect } from 'react';

// Define the interface for the dictionary data
interface DictionaryEntry {
  id: string;
  word: string;
  word_type: string;
  meaning: string;
  example_usage: string;
}

export default function DictionaryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingExample, setLoadingExample] = useState(false);
  const [showFullMeaning, setShowFullMeaning] = useState(false);
  const [result, setResult] = useState<DictionaryEntry | null>(null);
  const [error, setError] = useState('');
  const [trending, setTrending] = useState<DictionaryEntry[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Fetch trending and load recent searches on mount
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/dictionary/trending');
        if (response.ok) {
          const data = await response.json();
          setTrending(data);
        }
      } catch (err) {
        console.error('Failed to fetch trending words:', err);
      }
    };
    fetchTrending();

    // Load recent searches
    const saved = localStorage.getItem('recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (err) {
        // Ignored
      }
    }
  }, []);

  const removeRecentSearch = (word: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(w => w !== word);
      localStorage.setItem('recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent_searches');
  };

  const fetchLazyExample = async (word: string) => {
    setLoadingExample(true);
    try {
      const response = await fetch(`http://localhost:5000/api/dictionary/example?q=${encodeURIComponent(word)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.example_usage) {
          setResult(prev => prev && prev.word.toLowerCase() === word.toLowerCase() ? {
            ...prev,
            example_usage: data.example_usage
          } : prev);
        }
      }
    } catch (err) {
      console.error('Failed to lazy load example sentence:', err);
    } finally {
      setLoadingExample(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const query = (overrideQuery || searchQuery).trim();
    if (!query) return;

    setLoading(true);
    setError('');
    setResult(null);
    setLoadingExample(false);
    setShowFullMeaning(false);

    try {
      const response = await fetch(`http://localhost:5000/api/dictionary/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Kata tidak ditemukan.');
      } else {
        setResult(data);

        // Save to recent searches history
        setRecentSearches(prev => {
          const filtered = prev.filter(w => w !== data.word.toLowerCase());
          const updated = [data.word.toLowerCase(), ...filtered].slice(0, 5);
          localStorage.setItem('recent_searches', JSON.stringify(updated));
          return updated;
        });

        // Trigger lazy loading for example sentence if empty
        if (!data.example_usage || data.example_usage.trim() === '') {
          fetchLazyExample(data.word);
        }
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Gagal menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-max-width-content mx-auto px-margin-mobile md:px-md py-md md:py-lg flex flex-col gap-lg">
      {/* Search Section */}
      <section className="flex flex-col items-center gap-md w-full max-w-2xl mx-auto mt-lg">
        <h1 className="font-display-lg text-display-lg text-center text-on-surface">Kamus Kata</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant text-center">
          Cari definisi, jenis kata, dan contoh penggunaan untuk membantu permainan Sambung Kata kamu.
        </p>
        <form onSubmit={handleSearch} className="relative w-full shadow-[0_4px_12px_rgba(37,99,235,0.08)] rounded-full">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant text-[28px]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-24 py-4 rounded-full border-2 border-surface-variant bg-surface-container-lowest font-title-md text-title-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
            placeholder="Cari kata di sini..."
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-on-primary font-label-md text-label-md px-6 py-2 rounded-full border-b-[3px] border-on-primary-fixed-variant hover:bg-on-primary-fixed-variant active:border-b-0 active:translate-y-[3px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Mencari...' : 'Cari'}
          </button>
        </form>
        {error && (
          <p className="font-body-md bg-error-container text-on-error-container px-4 py-2 rounded-lg mt-2">
            {error}
          </p>
        )}
      </section>

      {/* Results Section (Bento Grid Style) */}
      {result && (
        <section className="grid grid-cols-1 md:grid-cols-12 gap-md mt-md text-left">
          {/* Main Featured Result */}
          <div className="md:col-span-8 bg-surface-container-lowest rounded-xl p-lg shadow-[0_4px_16px_rgba(37,99,235,0.06)] border border-surface-variant flex flex-col gap-md relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-sm">
                <h2 className="font-display-lg text-display-lg text-primary m-0 leading-none capitalize">{result.word}</h2>
                <span className="bg-secondary-container text-on-secondary-container font-label-md text-label-md px-3 py-1 rounded-full w-fit capitalize">
                  {result.word_type || 'Tidak Diketahui'}
                </span>
              </div>
              <button
                onClick={() => {
                  const speech = new SpeechSynthesisUtterance(result.word);
                  speech.lang = 'id-ID';
                  window.speechSynthesis.speak(speech);
                }}
                className="text-outline hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container-low"
                title="Dengarkan pengucapan"
              >
                <span className="material-symbols-outlined text-[28px]">volume_up</span>
              </button>
            </div>
            <div className="flex flex-col gap-xs mt-sm">
              <h3 className="font-title-md text-title-md text-on-surface">Definisi</h3>
              <p className="font-body-lg text-body-lg text-on-surface-variant transition-all">
                {result.meaning.length > 200 && !showFullMeaning
                  ? `${result.meaning.slice(0, 200)}...`
                  : result.meaning}
              </p>
              {result.meaning.length > 200 && (
                <button
                  type="button"
                  onClick={() => setShowFullMeaning(!showFullMeaning)}
                  className="text-primary hover:text-on-primary-fixed-variant font-label-md text-label-md w-fit flex items-center gap-1 mt-1 transition-colors font-semibold cursor-pointer"
                >
                  {showFullMeaning ? 'Tampilkan Lebih Sedikit' : 'Tampilkan Lebih Banyak'}
                  <span className="material-symbols-outlined text-[18px]">
                    {showFullMeaning ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Related Info / Example Sentence */}
          <div className="md:col-span-4 flex flex-col gap-md">
            <div className="bg-surface-container-lowest rounded-xl p-md shadow-[0_4px_16px_rgba(37,99,235,0.06)] border border-surface-variant flex-1 flex flex-col gap-md">
              <h3 className="font-title-md text-title-md text-on-surface mb-sm flex items-center gap-2 border-b border-surface-variant pb-2">
                <span className="material-symbols-outlined text-secondary">info</span>
                Info Kata
              </h3>

              {loadingExample ? (
                <div className="flex flex-col gap-sm bg-surface-container-low p-md rounded-lg border-l-4 border-secondary animate-pulse">
                  <h3 className="font-label-sm text-label-sm text-on-surface font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-secondary animate-spin">sync</span>
                    Menghasilkan Contoh Kalimat (AI)...
                  </h3>
                  <div className="h-3 bg-surface-container-highest rounded w-3/4"></div>
                </div>
              ) : result.example_usage ? (
                <div className="flex flex-col gap-xs bg-surface-container-low p-md rounded-lg border-l-4 border-secondary">
                  <h3 className="font-label-sm text-label-sm text-on-surface font-semibold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-secondary">magic_button</span>
                    Contoh Penggunaan (AI Generated)
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant italic mt-2">"{result.example_usage}"</p>
                </div>
              ) : (
                <p className="font-body-md text-outline-variant italic">Contoh kalimat tidak tersedia.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Recent Searches Row */}
      {recentSearches.length > 0 && (
        <section className="mt-lg text-left">
          <div className="flex justify-between items-center mb-md animate-slide-up-fade">
            <h2 className="font-title-md text-title-md text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">history</span>
              Pencarian Terakhir
            </h2>
            <button
              onClick={clearRecentSearches}
              className="text-label-sm text-outline hover:text-error transition-colors flex items-center gap-1 cursor-pointer font-medium"
            >
              <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
              Hapus Semua
            </button>
          </div>
          <div className="flex flex-wrap gap-sm">
            {recentSearches.map((word, index) => (
              <div
                key={word}
                style={{ animationDelay: `${index * 50}ms` }}
                className="animate-slide-up-fade flex items-center gap-2 bg-surface-container-low hover:bg-surface-container border border-surface-variant hover:border-primary/40 px-md py-sm rounded-full transition-all shadow-sm group hover:scale-[1.03]"
              >
                <button
                  onClick={() => {
                    setSearchQuery(word);
                    handleSearch(undefined, word);
                  }}
                  className="font-body-md text-body-md text-on-surface capitalize cursor-pointer flex items-center gap-1.5 font-medium"
                >
                  <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-primary transition-colors">search</span>
                  {word}
                </button>
                <button
                  onClick={() => removeRecentSearch(word)}
                  className="text-outline hover:text-error rounded-full p-0.5 hover:bg-surface-container-high transition-colors flex items-center justify-center cursor-pointer"
                  title="Hapus"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trending Words Row */}
      {trending.length > 0 && (
        <section className="mt-lg text-left">
          <h2 className="font-title-md text-title-md text-on-surface mb-md animate-slide-up-fade">Pencarian Populer</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
            {trending.map((t, index) => (
              <button
                key={t.id}
                onClick={() => {
                  setSearchQuery(t.word);
                  handleSearch(undefined, t.word);
                }}
                style={{ animationDelay: `${index * 75}ms` }}
                className="bg-surface-container-lowest p-sm rounded-lg border border-surface-variant hover:border-primary hover:shadow-md transition-all flex flex-col justify-between h-24 text-left cursor-pointer animate-slide-up-fade shadow-sm hover:scale-[1.03] active:scale-[0.98]"
              >
                <span className="font-label-md text-label-md text-on-surface-variant capitalize">{t.word_type || 'Kata'}</span>
                <span className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface capitalize">{t.word}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
