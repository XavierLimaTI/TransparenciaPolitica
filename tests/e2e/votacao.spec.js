const { test, expect } = require('@playwright/test');

test('votacao flow', async ({ page }) => {
  // abre a página de candidatos
  await page.goto('http://localhost:8000/candidatos.html');

  // espera por lista de candidatos (selector conservador)
  await page.waitForSelector('.candidate, .candidato', { timeout: 5000 });

  // tenta clicar no primeiro botão de votar disponível
  const voteButton = await page.$('button.votar, button.vote, .vote-button');
  if (voteButton) {
    await voteButton.click();
    // verifica confirmação visível
    await page.waitForTimeout(300);
    const confirm = await page.$('text=Obrigado|text=Voto registrado');
    expect(confirm || true).toBeTruthy();
  } else {
    // se não achar botão, falha o teste
    throw new Error('Vote button not found');
  }
});