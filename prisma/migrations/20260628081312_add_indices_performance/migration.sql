-- CreateIndex
CREATE INDEX "afericoes_posto_id_criado_em_idx" ON "afericoes"("posto_id", "criado_em");

-- CreateIndex
CREATE INDEX "afericoes_lote_id_idx" ON "afericoes"("lote_id");

-- CreateIndex
CREATE INDEX "afericoes_bico_id_idx" ON "afericoes"("bico_id");

-- CreateIndex
CREATE INDEX "colaboradores_posto_id_idx" ON "colaboradores"("posto_id");

-- CreateIndex
CREATE INDEX "documentos_posto_id_idx" ON "documentos"("posto_id");

-- CreateIndex
CREATE INDEX "documentos_data_vencimento_idx" ON "documentos"("data_vencimento");

-- CreateIndex
CREATE INDEX "documentos_status_idx" ON "documentos"("status");

-- CreateIndex
CREATE INDEX "raqs_posto_id_data_idx" ON "raqs"("posto_id", "data");

-- CreateIndex
CREATE INDEX "users_posto_id_idx" ON "users"("posto_id");

-- CreateIndex
CREATE INDEX "users_reset_token_idx" ON "users"("reset_token");
