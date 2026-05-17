export default function LeaderboardPage() {
  return (
    <div className="w-full max-w-content mx-auto px-margin-mobile md:px-margin-desktop pt-lg pb-xl flex flex-col gap-md">
      <div className="text-center mb-md mt-lg">
        <h1 className="font-display-lg text-display-lg text-primary mb-sm">Leaderboard</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Top players in the word-chain challenge.</p>
      </div>

      {/* Top 3 Podiums */}
      <div className="grid grid-cols-3 gap-sm items-end mb-lg pt-lg">
        {/* 2nd Place */}
        <div className="flex flex-col items-center justify-end order-1">
          <div className="w-16 h-16 rounded-full bg-surface-container-high mb-sm flex items-center justify-center overflow-hidden border-4 border-outline-variant">
            <img alt="Budi" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEibWBZ-bipDzLzQCMEcZZaYwTKeNuowYTADy3RcyTyT3ebTDgrRKLlxLgzKqj3DTPl3qtAt3alV9zYeVvaOXsmUg4dt4hxZhPdeLeeBC5MlQiOmescvT8PGe1hd3JwJPWREoySuPc-2GZZheJAsHVEx_wCs5FEgZRSqC5CnON9pCO_5adG4eDf_USeGqmVSkyXPSknMcJkE5bnVCWbD75R-PMaVJdu9plCpjHJ4ZZVFPyaNG9jMUUByH3nbost80vg1BMdtlTeNM" />
          </div>
          <div className="bg-surface-container-low rounded-t-xl w-full flex flex-col items-center py-md border-t-4 border-outline-variant shadow-sm h-32 relative">
            <div className="absolute -top-3 bg-outline-variant text-on-surface font-label-sm text-label-sm px-2 py-1 rounded-full">#2</div>
            <span className="font-title-md text-title-md text-on-surface mt-sm text-center line-clamp-1 w-full px-2">Budi</span>
            <span className="font-label-md text-label-md text-primary mt-xs">14,200</span>
          </div>
        </div>

        {/* 1st Place */}
        <div className="flex flex-col items-center justify-end order-2 z-10 relative -mt-lg">
          <span className="material-symbols-outlined text-secondary-container mb-xs" style={{ fontSize: '32px', fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
          <div className="w-20 h-20 rounded-full bg-secondary-container mb-sm flex items-center justify-center overflow-hidden border-4 border-secondary-container shadow-lg">
            <img alt="Ani" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSUzrHZ5-NIzCOt2WbEEqG1wXGn-B1hKbfD7aDn2Xb5myT9i9KwbdgY0M7dZslKm2Aj7H2Rr1KXy3j6cAMoylrPDlRMgar9ISVhZ-AnXmDAqLqUm8XU81yBpASoToC2zemXcrfiw_SfRDKceqUCnkOny4GnuMBx14WfsUfTA4bM3aKfa7j29A01K_L7l6TfxX5r2w7cZLnu8Nu4eNanv_v4GAQSildw6W9tK2WWoxGssNdJMApLDLKzbRtZ7wOcG4L99qt2ikuLPA" />
          </div>
          <div className="bg-surface-container rounded-t-xl w-full flex flex-col items-center py-md border-t-4 border-secondary-container shadow-md h-40 relative">
            <div className="absolute -top-3 bg-secondary-container text-on-secondary-container font-label-md text-label-md px-3 py-1 rounded-full font-bold">#1</div>
            <span className="font-title-md text-title-md text-on-surface mt-sm text-center line-clamp-1 w-full px-2">Ani</span>
            <span className="font-label-md text-label-md text-primary mt-xs font-bold text-lg">15,850</span>
          </div>
        </div>

        {/* 3rd Place */}
        <div className="flex flex-col items-center justify-end order-3">
          <div className="w-16 h-16 rounded-full bg-surface-container-high mb-sm flex items-center justify-center overflow-hidden border-4 border-[#cd7f32]">
            <img alt="Citra" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNV8u1OX_rBxyZW1INEVHr33kKXuXPf97jj06WfVb8wvlVADcLvUQzvJ90yt5uB3uTfcT9jOuNWGiUC9LFrXXt3pADZZALzqs-1-Dcuc_nsiHYCnGx3b4XTHQFdUPMQnMxHzooibonkyqQd61G7jDg67XA5VfMkPvAxxVJh1yn-qlW6S5slBn-MYBVCSL4XGhr4eVzX5HWi6K53CH_5RiGPblM9bpo4C7npsnhlibBZ6vh02cj0c023vHgDv3RfW2kf-3tmH4adh8" />
          </div>
          <div className="bg-surface-container-low rounded-t-xl w-full flex flex-col items-center py-md border-t-4 border-[#cd7f32] shadow-sm h-28 relative">
            <div className="absolute -top-3 bg-[#cd7f32] text-white font-label-sm text-label-sm px-2 py-1 rounded-full">#3</div>
            <span className="font-title-md text-title-md text-on-surface mt-sm text-center line-clamp-1 w-full px-2">Citra</span>
            <span className="font-label-md text-label-md text-primary mt-xs">13,900</span>
          </div>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="bg-surface rounded-xl shadow-sm border border-outline-variant overflow-hidden flex flex-col text-left">
        <div className="flex items-center px-md py-sm border-b border-outline-variant bg-surface-container-lowest">
          <div className="w-12 text-center font-label-sm text-label-sm text-on-surface-variant">Rank</div>
          <div className="flex-grow font-label-sm text-label-sm text-on-surface-variant px-sm">Player</div>
          <div className="w-24 text-right font-label-sm text-label-sm text-on-surface-variant">Score</div>
        </div>
        <div className="flex flex-col">
          {/* Rank 4 */}
          <div className="flex items-center px-md py-sm border-b border-surface-variant hover:bg-surface-container-low transition-colors">
            <div className="w-12 text-center font-title-md text-title-md text-on-surface-variant">4</div>
            <div className="flex-grow flex items-center gap-sm px-sm">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-variant">
                <img alt="Dodi" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB60i6ibaKJ-AAfI9O1wHIHTLzVXXE-orxcvn79c1y5KhE0Zo2rW_CmH0RuhPW_I8LcplcYWrO3f9MLP-4YvnQqoETnXFPNBsQw9WzsYk1T_zfwf8DDrtOJtek8Q7sLOARKIcvGGLpZ7TaMGekZ9LLDbQEzKg18HRqavnBk8vgRaCnJ4GPd76lrDRWfJjcxVeFZ6jb0KCJwjKT13j-qOKuXy3q_EH-y7r-jRnYinku3ARK7Oz_h2ntoRV0rI0yiyz-bxscf9x_FlIU" />
              </div>
              <span className="font-body-md text-body-md text-on-surface">Dodi</span>
            </div>
            <div className="w-24 text-right font-label-md text-label-md text-primary">12,500</div>
          </div>
          {/* Rank 5 */}
          <div className="flex items-center px-md py-sm border-b border-surface-variant hover:bg-surface-container-low transition-colors">
            <div className="w-12 text-center font-title-md text-title-md text-on-surface-variant">5</div>
            <div className="flex-grow flex items-center gap-sm px-sm">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-variant">
                <img alt="Eka" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwF_0xB2zjhpIozyT31C9Y14ZECWiPgmVIOxI6f2Jc-Uhf82b3rz2neJ4dm_xt7lwmpTfFh999D0zWNZhbRHpZ_U98GW9dPNHU7SYtauRlZ22351y9ijpP6eZKBztHPk48hQpWMmz8hRklH-8Kk-TJNVhsOrPEqkKHRAsKstPGPL_Juo_I6NlDBVHTtF3DSE_GCGmQJ-zUBbLNbN9GjkLKPiRK1gfyTknt61BoqulH_R2NGiyPQHt-tPvpQFhzHBWFC7x3gBdPF94" />
              </div>
              <span className="font-body-md text-body-md text-on-surface">Eka</span>
            </div>
            <div className="w-24 text-right font-label-md text-label-md text-primary">11,200</div>
          </div>
          {/* Rank 6 */}
          <div className="flex items-center px-md py-sm border-b border-surface-variant hover:bg-surface-container-low transition-colors">
            <div className="w-12 text-center font-title-md text-title-md text-on-surface-variant">6</div>
            <div className="flex-grow flex items-center gap-sm px-sm">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-variant">
                <img alt="Feri" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNGIy5Tki7K_pp7D0vraRH0gO4KyhZDzFfRUbozXVNqCkLeASlJ-6JLWuQAzDi5jHYxCek1Gf0Tak0w4WyK2J6ouay2_qK_yZ2M_C2ddJPK_Z5u78RpQGc27kyFipr0QaLtq5cGZdUB1bJuxP-8ogyUv7dzVUr5BMb7nvhGPhr4S8CP42fwah85iFq8qoLtRe9lNv_BGHNg_7AbAj7x3jEwUEE6-lGswgJQMhn3_jke0mzRL86ZcRNLhpQiiOdNpVlsgLt_8wIYjE" />
              </div>
              <span className="font-body-md text-body-md text-on-surface">Feri</span>
            </div>
            <div className="w-24 text-right font-label-md text-label-md text-primary">10,800</div>
          </div>
        </div>
      </div>

      {/* My Rank Sticky Bottom (Desktop) / Normal flow (Mobile, sticky done by container) */}
      <div className="mt-auto pt-md sticky bottom-[80px] md:bottom-auto z-40 text-left">
        <div className="bg-primary-container text-on-primary-container rounded-xl shadow-lg border-2 border-primary overflow-hidden flex items-center px-md py-sm">
          <div className="w-12 text-center font-title-md text-title-md font-bold">42</div>
          <div className="flex-grow flex items-center gap-sm px-sm">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-variant border-2 border-on-primary-container">
              <img alt="Me" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuANogxsPb_544ZoFhMCuJ0H3iuILhbbnte7-hqLyljSjZGU6pxdCBpYmEtnfOBEnAe08pVKjcUXtAhjxUDyLGDkJerZKqg-P-54tjQuRys4maPK5bso2sz8cPzhL8UmRAn1ivORHPEHd-gT1zCY2A3K-q1zTpFe9TNTqdUuKhwkxuNEer1dIAuIKlpSV4GD8GMc0dA-lhnGhj8cQ0A2kF_AyoVtmg_3A0-mlO8vqq3QFbmq8owMXS_G6wsy7OuzjGGyCDIZz3aieQI" />
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md font-bold">You</span>
              <span className="font-label-sm text-label-sm opacity-80">Keep going!</span>
            </div>
          </div>
          <div className="w-24 text-right font-title-md text-title-md font-bold">4,500</div>
        </div>
      </div>
    </div>
  );
}
