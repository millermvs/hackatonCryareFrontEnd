// fornecedor/pages/dashboard/dashboard.component.ts
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLink, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent {

  private http = inject(HttpClient);

  // Em hackathon: fixa (depois você troca pelo id do usuário logado)
  idFornecedor = 1;

  totalOportunidades = signal<number>(0);
  totalMinhasPropostas = signal<number>(0);
  totalAguardandoRetorno = signal<number>(0);
  totalFinalizadas = signal<number>(0);

  mensagemOportunidades = signal<string>('');
  mensagemMinhasPropostas = signal<string>('');
  mensagemAguardandoRetorno = signal<string>('');
  mensagemFinalizadas = signal<string>('');

  ngOnInit() {
    this.buscarOportunidades();
    this.buscarMinhasPropostas();
    this.buscarAguardandoRetorno();
    this.buscarFinalizadas();
  }

  // endpoints backend 
  private readonly endPointOportunidades =
    `${environment.api.empresas}/abertas?page=0&size=1`;

  buscarOportunidades() {
    this.http.get(this.endPointOportunidades).subscribe({
      next: (response: any) => this.totalOportunidades.set(response.totalElements ?? 0),
      error: (e: any) => this.mensagemOportunidades.set(e?.error?.message || 'Erro ao consultar oportunidades.'),
    });
  }

  private readonly endPointMinhasPropostas =
    `${environment.api.empresas}/fornecedores/${this.idFornecedor}?page=0&size=1`;

  buscarMinhasPropostas() {
    this.http.get(this.endPointMinhasPropostas).subscribe({
      next: (response: any) => this.totalMinhasPropostas.set(response.totalElements ?? 0),
      error: (e: any) => this.mensagemMinhasPropostas.set(e?.error?.message || 'Erro ao consultar suas propostas.'),
    });
  }

  private readonly endPointAguardandoRetorno =
    `${environment.api.empresas}/fornecedores/${this.idFornecedor}/status/AGUARDANDO_RETORNO?page=0&size=1`;

  buscarAguardandoRetorno() {
    this.http.get(this.endPointAguardandoRetorno).subscribe({
      next: (response: any) => this.totalAguardandoRetorno.set(response.totalElements ?? 0),
      error: (e: any) => this.mensagemAguardandoRetorno.set(e?.error?.message || 'Erro ao consultar propostas em análise.'),
    });
  }

  private readonly endPointFinalizadas =
    `${environment.api.empresas}/fornecedores/${this.idFornecedor}/status/FINALIZADA?page=0&size=1`;

  buscarFinalizadas() {
    /*
    this.http.get(this.endPointFinalizadas).subscribe({
      next: (response: any) => this.totalFinalizadas.set(response.totalElements ?? 0),
      error: (e: any) => this.mensagemFinalizadas.set(e?.error?.message || 'Erro ao consultar propostas finalizadas.'),
    });
    */
  }
}
