document.querySelector('#load-score').addEventListener('click', async () => {
  const response = await fetch('/api/score');
  const data = await response.json();
  document.querySelector('#result').textContent = `score:${data.score}`;
  document.querySelector('#result').dataset.loaded = 'true';
});
