import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-servicos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './servicos.html',
  styleUrl: './servicos.css',
})
export class Servicos {

  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  // hackathon: id fixo
  idEmpresa: number = 1;

  // ===================== MENSAGENS =====================
  mensagemPagPrincipal = signal<string>('');
  mensagemModal = signal<string>('');
  tipoMensagem = signal<string>('');

  // ===================== PAGINAÇÃO =====================
  paginaAtual = signal<number>(0);
  totalPaginas = signal<number>(0);
  readonly tamanhoPagina = 10;

  // ===================== LISTAS =====================
  servicos = signal<any[]>([]);
  servicosFounds = signal<any[]>([]);
  ativarBodyPesquisa = signal<boolean>(false);

  // ===================== MODAL =====================
  @ViewChild('btnCloseAddModal')
  btnCloseAddModal!: ElementRef<HTMLButtonElement>;

  servicoSelecionadoParaDelete: any = null;

  ngOnInit() {
    this.consultarServicos(this.paginaAtual());
  }

  // ===================== LISTAR (PAGINADO) =====================
  private readonly baseUrl = `${environment.api.servicos}`;

  consultarServicos(page: number) {
    const endpointConsultar =
      `${this.baseUrl}/listar/com-cotacoes-abertas?page=${page}&size=${this.tamanhoPagina}`;

    this.http.get(endpointConsultar).subscribe({
      next: (response: any) => {
        this.ativarBodyPesquisa.set(false);
        this.formPesquisarServico.get('nomeServico')?.setValue('');
        this.servicos.set(response.content ?? []);

        this.paginaAtual.set(response.number ?? 0);
        this.totalPaginas.set(response.totalPages ?? 0);

        this.mensagemPagPrincipal.set('');
      },
      error: (e: any) => {
        this.tipoMensagem.set('danger');
        this.mensagemPagPrincipal.set(e?.error?.message || 'Erro ao buscar serviços.');
      }
    });
  }

  irParaPagina(page: number): void {
    if (page < 0 || page >= this.totalPaginas()) return;
    this.consultarServicos(page);
  }

  totalPaginasArray(): number[] {
    return Array.from({ length: this.totalPaginas() }, (_, index) => index);
  }

  // ===================== PESQUISAR =====================
  formPesquisarServico = this.fb.group({
    nomeServico: ['', [Validators.required, Validators.pattern('^.{1,100}$')]]
  });

  pesquisarPorTipoServico() {
  const tipoServico = this.formPesquisarServico.value.nomeServico;

  // se não selecionar nada, volta pra listagem normal
  if (!tipoServico) {
    this.consultarServicos(0);
    return;
  }

  const endpoint =
    `${this.baseUrl}/listar/tipo?tipoServico=${encodeURIComponent(tipoServico)}&page=0&size=${this.tamanhoPagina}`;

  this.http.get(endpoint).subscribe({
    next: (response: any) => {
      this.servicosFounds.set(response.content ?? []);
      this.ativarBodyPesquisa.set(true);
      this.mensagemPagPrincipal.set('');
    },
    error: (e: any) => {
      this.servicosFounds.set([]);
      this.ativarBodyPesquisa.set(true);
      this.tipoMensagem.set('danger');
      this.mensagemPagPrincipal.set(
        e?.error?.message || 'Nenhum serviço encontrado para este tipo.'
      );
    }
  });
}


  // ===================== CADASTRAR =====================
  formAddServico = this.fb.group({
    tipoServico: ['', [Validators.required, Validators.pattern('^.{1,100}$')]],
    descricaoServico: ['', [Validators.required, Validators.pattern('^.{1,255}$')]]
  });

  addServico() {
    if (this.formAddServico.invalid) {
      this.formAddServico.markAllAsTouched();
      return;
    }

    const payload = {
      nomeServico: this.idEmpresa,
      valorServico: 0,
      tipoServico: this.formAddServico.value.tipoServico?.trim(),
      descricaoServico: this.formAddServico.value.descricaoServico?.trim(),
    };

    const endpoint = `${this.baseUrl}/cadastrar`;

    this.http.post(endpoint, payload).subscribe({
      next: (_: any) => {
        this.tipoMensagem.set('success');
        this.mensagemPagPrincipal.set('Serviço cadastrado com sucesso.');
        this.formAddServico.reset();        
        this.btnCloseAddModal?.nativeElement.click();

        setTimeout(() => this.mensagemPagPrincipal.set(''), 5000);
      },
      error: (e: any) => {
        this.tipoMensagem.set('danger');
        this.mensagemModal.set(e?.error?.message || 'Erro ao cadastrar serviço.');
        setTimeout(() => this.mensagemModal.set(''), 3000);
      }
    });
  }

  // ====== EDITAR (APENAS DESCRIÇÃO) ======
servicoSelecionadoParaEditar: any = null;

@ViewChild('btnCloseEditModal')
btnCloseEditModal!: ElementRef<HTMLButtonElement>;

formEditServico = this.fb.group({
  idServico: [''],
  descricaoServico: ['', [Validators.required, Validators.maxLength(255)]],
});

abrirModalEditar(servico: any) {
  this.servicoSelecionadoParaEditar = servico;

  this.formEditServico.patchValue({
    idServico: servico.idServico ?? servico.id,
    descricaoServico: servico.descricaoServico ?? ''
  });
}

editarServico() {
  if (this.formEditServico.invalid) {
    this.formEditServico.markAllAsTouched();
    return;
  }

  const id = this.formEditServico.value.idServico;

  const payload = {
    descricaoServico: this.formEditServico.value.descricaoServico?.trim()
  };

  const endpoint = `${this.baseUrl}/editar/descricao/${id}`;

  this.http.put(endpoint, payload).subscribe({
    next: (_: any) => {
      this.tipoMensagem.set('success');
      this.mensagemPagPrincipal.set('Descrição do serviço atualizada com sucesso.');
      this.mensagemModal.set('');
      this.servicoSelecionadoParaEditar = null;

      
      this.btnCloseEditModal?.nativeElement.click();

      setTimeout(() => this.mensagemPagPrincipal.set(''), 3000);
    },
    error: (e: any) => {
      this.tipoMensagem.set('danger');
      this.mensagemModal.set(e?.error?.message || 'Erro ao editar descrição do serviço.');
    }
  });
}


  // ===================== DELETE =====================
abrirModalConfirmarDelete(servico: any) {
  this.servicoSelecionadoParaDelete = servico;
}

deletarServico() {
  if (!this.servicoSelecionadoParaDelete) {
    return;
  }

  // garante compatibilidade com backend
  const idServico =
    this.servicoSelecionadoParaDelete.idServico ??
    this.servicoSelecionadoParaDelete.id;

  const endpoint = `${this.baseUrl}/deletar/${idServico}`;

  this.http.delete(endpoint).subscribe({
    next: (_: any) => {
      this.tipoMensagem.set('success');
      this.mensagemPagPrincipal.set('Serviço deletado com sucesso.');

      this.servicoSelecionadoParaDelete = null;
      this.consultarServicos(this.paginaAtual());

      setTimeout(() => {
        this.mensagemPagPrincipal.set('');
      }, 3000);
    },
    error: (e: any) => {
      this.tipoMensagem.set('danger');
      this.mensagemPagPrincipal.set(
        e?.error?.message || 'Erro ao deletar serviço.'
      );
    }
  });
}
}
