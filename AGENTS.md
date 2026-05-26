---
name: free-safe-adapters
description: Use esta skill ao criar adaptadores de infraestrutura do FREE SAFE: Supabase Storage, geração de PDF com @react-pdf/renderer e envio de e-mail com Resend. Cada adaptador implementa um port do domínio.
---

# FREE SAFE — Adaptadores de Infraestrutura

## Supabase Storage

```typescript
// src/infrastructure/storage/supabase-storage.adapter.ts

import { createClient } from '@supabase/supabase-js';
import type { StoragePort } from '@/domain/ports/storage.port';
import { env } from '@/lib/env';

// Buckets do projeto
const BUCKETS = {
  raq:           'raq-anexos',
  certificados:  'certificados',
  documentos:    'documentos-postos',
  manutencao:    'manutencao-fotos',
} as const;

export class SupabaseStorageAdapter implements StoragePort {
  private readonly client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  async upload(
    caminho: string,
    arquivo: Buffer,
    tipo: string,
  ): Promise<string> {
    const bucket = this.inferirBucket(caminho);

    const { error } = await this.client.storage
      .from(bucket)
      .upload(caminho, arquivo, {
        contentType: tipo,
        upsert: true,
      });

    if (error) throw new Error(`Falha no upload: ${error.message}`);

    const { data } = this.client.storage
      .from(bucket)
      .getPublicUrl(caminho);

    return data.publicUrl;
  }

  async deletar(caminho: string): Promise<void> {
    const bucket = this.inferirBucket(caminho);
    const { error } = await this.client.storage
      .from(bucket)
      .remove([caminho]);

    if (error) throw new Error(`Falha ao deletar arquivo: ${error.message}`);
  }

  private inferirBucket(caminho: string): string {
    if (caminho.startsWith('raq/'))          return BUCKETS.raq;
    if (caminho.startsWith('certificados/')) return BUCKETS.certificados;
    if (caminho.startsWith('documentos/'))   return BUCKETS.documentos;
    if (caminho.startsWith('manutencao/'))   return BUCKETS.manutencao;
    return BUCKETS.documentos; // fallback
  }
}
```

## Geração de PDF da RAQ

```typescript
// src/infrastructure/pdf/react-pdf.adapter.ts

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Font,
} from '@react-pdf/renderer';
import type { PDFPort } from '@/domain/ports/pdf.port';
import type { RAQ } from '@/domain/entities/raq.entity';
import type { Posto } from '@/domain/entities/posto.entity';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#f97316', // laranja FREE SAFE
  },
  titulo: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#f97316',
  },
  subtitulo: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  secao: {
    marginBottom: 16,
  },
  secaoTitulo: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  campo: {
    width: '48%',
    backgroundColor: '#f9fafb',
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  campoLabel: {
    fontSize: 8,
    color: '#9ca3af',
    marginBottom: 2,
  },
  campoValor: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  resultado: {
    padding: 14,
    borderRadius: 6,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultadoAprovado: {
    backgroundColor: '#d1fae5',
  },
  resultadoReprovado: {
    backgroundColor: '#fee2e2',
  },
  resultadoTexto: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
  },
  resultadoAprovadoTexto: {
    color: '#065f46',
  },
  resultadoReprovadoTexto: {
    color: '#7f1d1d',
  },
  rodape: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  rodapeTexto: {
    fontSize: 8,
    color: '#9ca3af',
  },
});

function RAQDocument({ raq, posto }: { raq: RAQ; posto: Posto }) {
  const aprovado = raq.estaAprovado;
  const dataFormatada = raq.criadoEm.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
  const horaFormatada = raq.criadoEm.toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  });

  return React.createElement(
    Document,
    { title: `RAQ — ${raq.produto} — ${dataFormatada}` },
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      // Cabeçalho
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.titulo }, 'FREE SAFE'),
          React.createElement(Text, { style: styles.subtitulo }, 'Registro de Análise da Qualidade — RAQ'),
        ),
        React.createElement(
          View,
          { style: { alignItems: 'flex-end' } },
          React.createElement(Text, { style: { fontSize: 9, color: '#6b7280' } }, `Data: ${dataFormatada}`),
          React.createElement(Text, { style: { fontSize: 9, color: '#6b7280' } }, `Hora: ${horaFormatada}`),
          React.createElement(Text, { style: { fontSize: 9, color: '#6b7280' } }, `ID: ${raq.id.slice(0, 8).toUpperCase()}`),
        ),
      ),
      // Dados do Posto
      React.createElement(
        View,
        { style: styles.secao },
        React.createElement(Text, { style: styles.secaoTitulo }, 'Dados do Posto'),
        React.createElement(
          View,
          { style: styles.grade },
          campo('Posto', posto.nome),
          campo('CNPJ', posto.cnpj),
          campo('Cidade/UF', `${posto.cidade}/${posto.uf}`),
          campo('Distribuidora', raq.distribuidora ?? '—'),
          campo('Nota Fiscal', raq.notaFiscal ?? '—'),
          campo('Placa do Caminhão', raq.placaCaminhao ?? '—'),
          campo('Tanque de Destino', raq.tanqueDestino ?? '—'),
        ),
      ),
      // Dados da Análise
      React.createElement(
        View,
        { style: styles.secao },
        React.createElement(Text, { style: styles.secaoTitulo }, 'Dados da Análise'),
        React.createElement(
          View,
          { style: styles.grade },
          campo('Produto', raq.produto.replace(/_/g, ' ')),
          campo('Temperatura observada', `${raq.temperaturaObservada} °C`),
          campo('Densidade observada', raq.densidadeObservada.toString()),
          campo('Aspecto', raq.aspecto.replace(/_/g, ' ')),
          campo('Cor', raq.cor),
          raq.faseAquosa ? campo('Fase aquosa (mL)', raq.faseAquosa.toString()) : null,
          raq.teorAlcoolico ? campo('Teor alcoólico (INPM)', raq.teorAlcoolico.toString()) : null,
        ),
      ),
      // Resultado
      React.createElement(
        View,
        { style: [styles.resultado, aprovado ? styles.resultadoAprovado : styles.resultadoReprovado] },
        React.createElement(
          Text,
          { style: [styles.resultadoTexto, aprovado ? styles.resultadoAprovadoTexto : styles.resultadoReprovadoTexto] },
          aprovado ? '✓ APROVADO' : '✗ REPROVADO',
        ),
        React.createElement(
          Text,
          { style: { fontSize: 9, color: aprovado ? '#065f46' : '#7f1d1d', marginTop: 2 } },
          aprovado
            ? 'Combustível dentro dos parâmetros da ANP.'
            : 'Combustível fora dos parâmetros. Comunicar distribuidora e suspender abastecimento.',
        ),
      ),
      // Rodapé
      React.createElement(
        View,
        { style: styles.rodape },
        React.createElement(Text, { style: styles.rodapeTexto }, 'FREE SAFE — Plataforma de Qualidade e Conformidade — Rede Free'),
        React.createElement(Text, { style: styles.rodapeTexto }, `Emitido em ${dataFormatada} às ${horaFormatada}`),
      ),
    ),
  );
}

function campo(label: string, valor: string) {
  return React.createElement(
    View,
    { style: styles.campo },
    React.createElement(Text, { style: styles.campoLabel }, label),
    React.createElement(Text, { style: styles.campoValor }, valor),
  );
}

export class ReactPDFAdapter implements PDFPort {
  async gerarRAQ(raq: RAQ, posto: Posto): Promise<Buffer> {
    const element = React.createElement(RAQDocument, { raq, posto });
    return renderToBuffer(element);
  }
}
```

## Adaptador de e-mail com Resend

```typescript
// src/infrastructure/email/resend-email.adapter.ts

import { Resend } from 'resend';
import type { EmailPort, EnviarAlertaInput } from '@/domain/ports/email.port';
import { env } from '@/lib/env';

export class ResendEmailAdapter implements EmailPort {
  private readonly client = new Resend(env.RESEND_API_KEY);

  async enviarAlerta(input: EnviarAlertaInput): Promise<void> {
    await this.client.emails.send({
      from:    'FREE SAFE <alertas@freesafe.com.br>',
      to:      input.para,
      subject: input.assunto,
      html:    this.template(input.assunto, input.corpo),
    });
  }

  async enviarDocumentoVencendo(input: {
    para: string;
    nomePosto: string;
    tipoDocumento: string;
    dataVencimento: Date;
  }): Promise<void> {
    const dias = Math.ceil(
      (input.dataVencimento.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    await this.client.emails.send({
      from:    'FREE SAFE <alertas@freesafe.com.br>',
      to:      input.para,
      subject: `⚠️ Documento vencendo em ${dias} dias — ${input.nomePosto}`,
      html:    this.template(
        `Documento vencendo: ${input.tipoDocumento}`,
        `O documento <strong>${input.tipoDocumento}</strong> do posto <strong>${input.nomePosto}</strong> vence em <strong>${dias} dias</strong> (${input.dataVencimento.toLocaleDateString('pt-BR')}).<br><br>Acesse o FREE SAFE para renovar.`,
      ),
    });
  }

  private template(titulo: string, corpo: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f97316; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">FREE SAFE</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">Plataforma de Qualidade e Conformidade</p>
          </div>
          <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #111827; font-size: 16px;">${titulo}</h2>
            <p style="color: #374151; line-height: 1.6;">${corpo}</p>
            <a href="${env.NEXTAUTH_URL}" style="display: inline-block; background: #f97316; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-top: 16px;">Acessar FREE SAFE</a>
          </div>
          <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 16px;">Rede Free — Todos os direitos reservados</p>
        </body>
      </html>
    `;
  }
}
```

## Port de e-mail (para o domínio referenciar)

```typescript
// src/domain/ports/email.port.ts

export interface EnviarAlertaInput {
  para: string;
  assunto: string;
  corpo: string;
}

export interface EmailPort {
  enviarAlerta(input: EnviarAlertaInput): Promise<void>;
}
```

## Port de PDF

```typescript
// src/domain/ports/pdf.port.ts

import type { RAQ } from '@/domain/entities/raq.entity';
import type { Posto } from '@/domain/entities/posto.entity';

export interface PDFPort {
  gerarRAQ(raq: RAQ, posto: Posto): Promise<Buffer>;
}
```

## Port de storage

```typescript
// src/domain/ports/storage.port.ts

export interface StoragePort {
  upload(caminho: string, arquivo: Buffer, tipo: string): Promise<string>;
  deletar(caminho: string): Promise<void>;
}
```

## Regras que o Codex deve seguir nos adaptadores

1. Adaptador importa o port do domínio e o implementa — nunca o contrário
2. Credenciais sempre via `env` de `@/lib/env` — nunca `process.env` direto
3. E-mail com falha não propaga para o caso de uso — o chamador usa `.catch(() => {})`
4. PDF retorna `Buffer` — não escreve arquivo em disco
5. Storage retorna a URL pública — o repositório salva a URL no banco
6. Buckets do Supabase são separados por tipo de conteúdo (raq-anexos, certificados, etc.)
7. `upsert: true` no upload do Storage — substitui arquivo existente pelo mesmo caminho