const baseUrl = 'http://localhost:8080/api/v1';

export const environment = {
  production: false,
  api: {
    empresas: `${baseUrl}/empresas`,
    fornecedores: `${baseUrl}/fornecedores`,
    servicos: `${baseUrl}/servicos`,
    cotacoes: `${baseUrl}/cotacoes`
  }
};