/* Simple proxy server for Google Imagen 3 */
import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json({ limit: '2mb' }));

app.post('/api/imagen', async (req, res) => {
  try {
    const { apiKey, prompt, aspectRatio } = req.body || {};
    
    if (!apiKey) return res.status(400).json({ error: 'Missing apiKey' });
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    // Configuração correta para Imagen 3
    const model = 'imagen-3.0-generate-001';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict`;

    // A estrutura para IMAGEN via REST API (Generative Language) é baseada em 'instances'
    const payload = {
      instances: [
        { prompt: prompt }
      ],
      parameters: {
        sampleCount: 1,
        // O Imagen aceita aspectRatios como "1:1", "16:9", "9:16", etc.
        aspectRatio: aspectRatio || "1:1" 
      }
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey // Melhor prática: Header em vez de URL
      },
      body: JSON.stringify(payload)
    });

    const text = await resp.text();

    // Tratamento de erro da API do Google
    if (!resp.ok) {
      console.error('Google API Error:', text);
      try {
        const errJson = JSON.parse(text);
        return res.status(resp.status).json(errJson);
      } catch {
        return res.status(resp.status).json({ error: text || `HTTP ${resp.status}` });
      }
    }

    // Sucesso
    const data = JSON.parse(text);
    
    // A resposta do Imagen 3 geralmente vem em: predictions[0].bytesBase64Encoded
    // ou predictions[0].mimeType e bytes. Vamos retornar o JSON bruto para o front tratar.
    return res.json(data);

  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
});

// Endpoint proxy para arquivos e planilhas do Google Drive / Google Sheets
app.get('/api/drive-proxy', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing file/sheet id' });

    // 1. Tentar primeiro export em XLSX (caso seja Google Sheets)
    const sheetExportUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`;
    let resp = await fetch(sheetExportUrl, { redirect: 'follow' });

    // 2. Se falhar, tentar download direto do Drive (caso seja arquivo .xlsx no Drive)
    if (!resp.ok) {
      const driveDownloadUrl = `https://drive.google.com/uc?export=download&id=${id}`;
      resp = await fetch(driveDownloadUrl, { redirect: 'follow' });
    }

    if (!resp.ok) {
      return res.status(resp.status).json({ 
        error: `Falha ao baixar arquivo do Google Drive (HTTP ${resp.status})` 
      });
    }

    const buffer = await resp.arrayBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Drive proxy error:', err);
    return res.status(500).json({ error: err.message || 'Erro ao buscar arquivo do Drive' });
  }
});

const port = process.env.PORT || 5174;
app.listen(port, () => {
  console.log(`[proxy] Imagen proxy listening on http://localhost:${port}`);
}); 