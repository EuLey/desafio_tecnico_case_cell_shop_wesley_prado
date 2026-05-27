// Stub do gateway de pagamento. Nesta versão (commit 7) sempre aprova.
// O commit 9 adiciona a regra "token contendo 'declined' → recusado".
export async function charge(_token: string): Promise<void> {
  return
}
