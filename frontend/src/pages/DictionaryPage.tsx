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
  const [result, setResult] = useState<DictionaryEntry | null>(null);
  const [error, setError] = useState('');
  const [trending, setTrending] = useState<DictionaryEntry[]>([]);

  // Fetch trending words on mount
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
  }, []);

  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const query = (overrideQuery || searchQuery).trim();
    if (!query) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`http://localhost:5000/api/dictionary/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Kata tidak ditemukan.');
      } else {
        setResult(data);
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
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-on-primary font-label-md text-label-md px-6 py-2 rounded-full border-b-[3px] border-[#003ea8] hover:bg-[#003ea8] active:border-b-0 active:translate-y-[3px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Mencari...' : 'Cari'}
          </button>
        </form>
        {error && (
          <p className="text-error font-body-md bg-error-container text-on-error-container px-4 py-2 rounded-lg mt-2">
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
              <p className="font-body-lg text-body-lg text-on-surface-variant">{result.meaning}</p>
            </div>
            
            {result.example_usage && (
              <div className="flex flex-col gap-xs mt-sm bg-surface-container-low p-md rounded-lg border-l-4 border-secondary">
                <h3 className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">magic_button</span>
                  Contoh Penggunaan (AI Generated)
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant italic">"{result.example_usage}"</p>
              </div>
            )}
          </div>

          {/* Related Info / Syllables */}
          <div className="md:col-span-4 flex flex-col gap-md">
            <div className="bg-surface-container-lowest rounded-xl p-md shadow-[0_4px_16px_rgba(37,99,235,0.06)] border border-surface-variant flex-1">
              <h3 className="font-title-md text-title-md text-on-surface mb-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">splitscreen</span>
                Info Kata
              </h3>
              <div className="flex flex-col gap-2 mt-4">
                <p className="font-label-sm text-label-sm text-outline">Huruf Terakhir:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-surface-container text-on-surface font-headline-lg-mobile text-headline-lg-mobile px-4 py-2 rounded-lg border border-outline-variant border-b-4 border-b-primary uppercase">
                    {result.word.slice(-2)}
                  </span>
                </div>
                <p className="font-label-sm text-label-sm text-outline mt-sm">
                  Jika ini dimainkan, kata selanjutnya harus berawalan <strong className="text-primary uppercase">{result.word.slice(-2)}</strong>
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trending Words Row */}
      {trending.length > 0 && (
        <section className="mt-lg text-left">
          <h2 className="font-title-md text-title-md text-on-surface mb-md">Pencarian Populer</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
            {trending.map((t) => (
              <button 
                key={t.id} 
                onClick={() => {
                  setSearchQuery(t.word);
                  handleSearch(undefined, t.word);
                }}
                className="bg-surface-container-lowest p-sm rounded-lg border border-surface-variant hover:border-primary hover:shadow-md transition-all flex flex-col justify-between h-24 text-left cursor-pointer"
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
