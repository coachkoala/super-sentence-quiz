// Renders the off-screen share card to an image and shares/downloads it.
// html2canvas is loaded globally via a <script> tag in index.html.

export async function shareScoreCard({ shareCardEl, hintEl, buttonEl, score, maxCombo, correctCount }) {
  buttonEl.disabled = true;
  hintEl.textContent = 'Menyiapkan gambar…';
  hintEl.classList.add('show');

  shareCardEl.querySelector('#scScore').textContent = score;
  shareCardEl.querySelector('#scCombo').textContent = maxCombo;
  shareCardEl.querySelector('#scCorrect').textContent = correctCount;

  try {
    const canvas = await html2canvas(shareCardEl, { backgroundColor: null, scale: 2 });
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('canvas.toBlob returned null');

    const file = new File([blob], 'skor-super-sentence-quiz.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Skor Super Sentence Quiz',
        text: `Skorku ${score} di Super Sentence Quiz, coba ngalahin! 🔥`,
      });
      hintEl.textContent = 'Terkirim!';
    } else if (navigator.share) {
      // Some mobile browsers support text/url sharing but not file sharing.
      await navigator.share({
        title: 'Skor Super Sentence Quiz',
        text: `Skorku ${score} di Super Sentence Quiz, coba ngalahin! 🔥`,
      });
      downloadBlob(blob);
      hintEl.textContent = 'Gambar skor tersimpan, tinggal upload manual 👍';
    } else {
      downloadBlob(blob);
      hintEl.textContent = 'Gambar skor tersimpan, tinggal share manual 👍';
    }
  } catch (err) {
    if (err && err.name === 'AbortError') {
      // User cancelled the native share sheet — not an error worth surfacing.
      hintEl.textContent = '';
      hintEl.classList.remove('show');
    } else {
      hintEl.textContent = 'Gagal bikin gambar, coba screenshot manual ya';
    }
  }
  buttonEl.disabled = false;
}

function downloadBlob(blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'skor-super-sentence-quiz.png';
  a.click();
  URL.revokeObjectURL(url);
}
