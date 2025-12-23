// empresa/pages/dashboard/dashboard.component.ts
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {

  private http = inject(HttpClient);

  // hackathon: id fixo (troca depois pelo logado)
  idEmpresa = 1;

  totalFornecedores = signal<number>(0);
  totalsrvicosAbertos = signal<number>(0);
  totalPropostasRecebidas = signal<number>(0);
  totalFinalizadas = signal<number>(0);

  mensagemFornecedores = signal<string>('');
  mensagemCotacoesAbertas = signal<string>('');
  mensagemPropostasRecebidas = signal<string>('');
  mensagemFinalizadas = signal<string>('');

  ngOnInit() {
    this.buscarFornecedores();
    this.buscarCotacoesAbertas();
    this.buscarPropostasRecebidas();
    this.buscarFinalizadas();
  }

  private endPointEmpresas =
    `${environment.api.empresas}/consultar/fornecedores`;

  buscarFornecedores() {
    this.http.get(this.endPointEmpresas).subscribe({
      next: (r: any) => this.totalFornecedores.set(r.totalElements ?? 0),
      error: (e: any) => this.mensagemFornecedores.set(e?.error?.message || 'Erro ao consultar fornecedores.'),
    });
  }

  private readonly endPointCotacoesAbertas =
    `http://localhost:8080/api/v1/servicos/listar/com-cotacoes-abertas`;;

  buscarCotacoesAbertas() {
    this.http.get(this.endPointCotacoesAbertas).subscribe({
      next: (r: any) => this.totalsrvicosAbertos.set(r.totalElements ?? 0),
      error: (e: any) => this.mensagemCotacoesAbertas.set(e?.error?.message || 'Erro ao consultar cotações abertas.'),
    });
  }

  private readonly endPointPropostasRecebidas =
    `http://localhost:8080/api/v1/cotacoes/listar/abertas`;

  buscarPropostasRecebidas() {
    this.http.get(this.endPointPropostasRecebidas).subscribe({
      next: (r: any) => this.totalPropostasRecebidas.set(r.totalElements ?? 0),
      error: (e: any) => this.mensagemPropostasRecebidas.set(e?.error?.message || 'Erro ao consultar propostas.'),
    });
  }

  private readonly endPointFinalizadas =
    `${environment.api.cotacoes}/empresa/${this.idEmpresa}/finalizadas?page=0&size=1`;

  buscarFinalizadas() {
    this.http.get(this.endPointFinalizadas).subscribe({
      next: (r: any) => this.totalFinalizadas.set(r.totalElements ?? 0),
      error: (e: any) => this.mensagemFinalizadas.set(e?.error?.message || 'Erro ao consultar finalizadas.'),
    });
  }
}
