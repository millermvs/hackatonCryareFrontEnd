import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-cotacoes',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './cotacoes.html',
  styleUrl: './cotacoes.css',
})
export class Cotacoes {

  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  // hackathon: fixo
  idEmpresa = 1;

  // mensagens
  mensagemPagPrincipal = signal('');
  mensagemModal = signal('');
  tipoMensagem = signal<'success' | 'danger'>('success');

  // paginação
  paginaAtual = signal(0);
  totalPaginas = signal(0);
  readonly tamanhoPagina = 10;

  // dados
  fornecedores = signal<any[]>([]);
  cotacoes = signal<any[]>([]);
  cotacoesFounds = signal<any[]>([]);
  ativarBodyPesquisa = signal(false);

  // seleções (modais)
  cotacaoSelecionada: any = null;
  cotacaoSelecionadaParaDelete: any = null;
  cotacaoSelecionadaParaRenegociar: any = null;

  // negociação (antiga)
  mensagemNegociacao: string = '';

  @ViewChild('btnCloseAddModal')
  btnCloseAddModal!: ElementRef<HTMLButtonElement>;

  // NOVO: fechar modal renegociar
  @ViewChild('btnCloseRenegociarModal')
  btnCloseRenegociarModal!: ElementRef<HTMLButtonElement>;

  // endpoints base
  private readonly baseUrlCotacoes = `${environment.api.cotacoes}`;
  private readonly baseUrlFornecedores = `${environment.api.fornecedores}`;

  // endpoint fixo (não mudar)
  private readonly endpointCotacoesAbertas = `http://localhost:8080/api/v1/cotacoes/listar/abertas`;

  ngOnInit() {
    this.carregarFornecedores();
    this.consultarCotacoes(0);
  }

aceitarCotacao(cotacao: any){
  this.cotacaoSelecionada = cotacao;
  const idCotacao = cotacao.idCotacao;
  const endpoint = `http://localhost:8080/api/v1/cotacoes/atualizar?idCotacao=${idCotacao}`;

  this.http.put(endpoint,"").subscribe({
    next: (response: any) => {
      console.log(response);
    },
    error: (e: any) =>{
      console.log(e);
    }
  });
  const endpointwhatsapp = 'https://webhooks.dentkin.com.br/webhook/ESCUTA-FLUTTERLFLOW-1d1142b77af8';
  
  const payload = {
      whatsApp: '5521965250053'
    };
  this.http.post(endpointwhatsapp,payload).subscribe({
    next: (response: any) => {
      console.log(response);
    },
    error: (e: any) => {
      console.log(e);
    }
  })
}

  // ===================== FORNECEDORES (para o select) =====================
  carregarFornecedores() {
    const endpoint = `${this.baseUrlFornecedores}/listar?page=0&size=200`;

    this.http.get(endpoint).subscribe({
      next: (res: any) => {
        const lista = Array.isArray(res) ? res : (res.content ?? []);
        this.fornecedores.set(lista);
      },
      error: () => {
        this.fornecedores.set([]);
      }
    });
  }

  // ===================== LISTAR (PAGINADO) =====================
  consultarCotacoes(page: number) {
    const endpoint =
      `${this.endpointCotacoesAbertas}?page=${page}&size=${this.tamanhoPagina}`;

    this.http.get(endpoint).subscribe({
      next: (res: any) => {
        this.cotacoes.set(res.content ?? []);
        this.paginaAtual.set(res.number ?? page);
        this.totalPaginas.set(res.totalPages ?? 0);

        this.ativarBodyPesquisa.set(false);
        this.formPesquisarCotacao.get('idFornecedor')?.setValue('');
        this.mensagemPagPrincipal.set('');
      },
      error: (e: any) => {
        this.tipoMensagem.set('danger');
        this.mensagemPagPrincipal.set(e?.error?.message || 'Erro ao buscar cotações.');
      }
    });
  }

  irParaPagina(page: number) {
    if (page < 0 || page >= this.totalPaginas()) return;
    this.consultarCotacoes(page);
  }

  totalPaginasArray(): number[] {
    return Array.from({ length: this.totalPaginas() }, (_, i) => i);
  }

  // ===================== PESQUISAR POR FORNECEDOR =====================
  formPesquisarCotacao = this.fb.group({
    idFornecedor: ['', [Validators.required]]
  });

  pesquisarPorFornecedor() {
    const idFornecedor = this.formPesquisarCotacao.value.idFornecedor;

    if (!idFornecedor) {
      this.consultarCotacoes(0);
      return;
    }

    const endpoint =
      `${this.baseUrlCotacoes}/listar/fornecedor?idFornecedor=${idFornecedor}&page=0&size=${this.tamanhoPagina}`;

    this.http.get(endpoint).subscribe({
      next: (res: any) => {
        const lista = Array.isArray(res) ? res : (res.content ?? []);
        this.cotacoesFounds.set(lista);
        this.ativarBodyPesquisa.set(true);
        this.mensagemPagPrincipal.set('');
      },
      error: (e: any) => {
        this.cotacoesFounds.set([]);
        this.ativarBodyPesquisa.set(true);
        this.tipoMensagem.set('danger');
        this.mensagemPagPrincipal.set(e?.error?.message || 'Nenhuma cotação encontrada.');
      }
    });
  }

  // ===================== CADASTRAR =====================
  formAddCotacao = this.fb.group({
    idFornecedor: ['', [Validators.required]],
    tipoServico: ['', [Validators.required]],
    valorCotacao: [0, [Validators.required]],
    descricaoCotacao: ['', [Validators.required, Validators.maxLength(255)]],
  });

  addCotacao() {
    if (this.formAddCotacao.invalid) {
      this.formAddCotacao.markAllAsTouched();
      return;
    }

    const payload = {
      idEmpresa: this.idEmpresa,
      idFornecedor: this.formAddCotacao.value.idFornecedor,
      tipoServico: this.formAddCotacao.value.tipoServico,
      valorCotacao: this.formAddCotacao.value.valorCotacao,
      descricaoCotacao: this.formAddCotacao.value.descricaoCotacao?.trim(),
    };

    const endpoint = `${this.baseUrlCotacoes}/cadastrar`;

    this.http.post(endpoint, payload).subscribe({
      next: () => {
        this.tipoMensagem.set('success');
        this.mensagemPagPrincipal.set('Cotação cadastrada com sucesso.');
        this.mensagemModal.set('');
        this.formAddCotacao.reset();

        this.consultarCotacoes(this.paginaAtual());
        this.btnCloseAddModal?.nativeElement.click();

        setTimeout(() => this.mensagemPagPrincipal.set(''), 3000);
      },
      error: (e: any) => {
        this.tipoMensagem.set('danger');
        this.mensagemModal.set(e?.error?.message || 'Erro ao cadastrar cotação.');
      }
    });
  }

  // ===================== DETALHES =====================
  abrirModalDetalhes(cotacao: any) {
    this.cotacaoSelecionada = cotacao;
  }

  // ===================== NEGOCIAR (fluxo antigo) =====================
  abrirModalNegociar(cotacao: any) {
    this.cotacaoSelecionada = cotacao;
    this.mensagemNegociacao = '';
  }

  confirmarNegociacao() {
    if (!this.cotacaoSelecionada || !this.mensagemNegociacao.trim()) return;

    const endpoint =
      `${this.baseUrlCotacoes}/negociar/${this.cotacaoSelecionada.idCotacao}`;

    const payload = { mensagem: this.mensagemNegociacao };

    this.http.put(endpoint, payload).subscribe({
      next: () => {
        this.tipoMensagem.set('success');
        this.mensagemPagPrincipal.set('Negociação enviada com sucesso.');

        this.mensagemNegociacao = '';
        this.cotacaoSelecionada = null;

        this.consultarCotacoes(this.paginaAtual());
        setTimeout(() => this.mensagemPagPrincipal.set(''), 3000);
      },
      error: (e: any) => {
        this.tipoMensagem.set('danger');
        this.mensagemPagPrincipal.set(e?.error?.message || 'Erro ao negociar cotação.');
      }
    });
  }

  // ===================== RENEGOCIAR (NOVO) =====================
  formRenegociarCotacao = this.fb.group({
    novoValor: [null as number | null, [Validators.required]],
    novoPrazo: ['', [Validators.required, Validators.maxLength(80)]],
    observacao: ['', [Validators.required, Validators.maxLength(255)]],
  });

  abrirModalRenegociar(cotacao: any) {
    this.cotacaoSelecionadaParaRenegociar = cotacao;
    this.mensagemModal.set('');
    this.tipoMensagem.set('success');

    // limpa e prepara o form
    this.formRenegociarCotacao.reset({
      novoValor: null,
      novoPrazo: '',
      observacao: ''
    });
  }

  renegociarCotacao() {
    if (!this.cotacaoSelecionadaParaRenegociar) return;

    if (this.formRenegociarCotacao.invalid) {
      this.formRenegociarCotacao.markAllAsTouched();
      return;
    }

    const id = this.cotacaoSelecionadaParaRenegociar.idCotacao;

    const payload = {
      novoValor: this.formRenegociarCotacao.value.novoValor,
      novoPrazo: this.formRenegociarCotacao.value.novoPrazo?.trim(),
      observacao: this.formRenegociarCotacao.value.observacao?.trim(),
    };

    // ⚠️ Ajuste aqui APENAS se seu endpoint real for outro
    const endpoint = `${this.baseUrlCotacoes}/renegociar/${id}`;

    this.http.put(endpoint, payload).subscribe({
      next: () => {
        this.tipoMensagem.set('success');
        this.mensagemPagPrincipal.set('Renegociação enviada com sucesso.');
        this.mensagemModal.set('');

        this.cotacaoSelecionadaParaRenegociar = null;
        this.formRenegociarCotacao.reset();

        this.consultarCotacoes(this.paginaAtual());
        this.btnCloseRenegociarModal?.nativeElement.click();

        setTimeout(() => this.mensagemPagPrincipal.set(''), 3000);
      },
      error: (e: any) => {
        this.tipoMensagem.set('danger');
        this.mensagemModal.set(e?.error?.message || 'Erro ao renegociar cotação.');
      }
    });
  }

  // ===================== DELETE =====================
  abrirModalConfirmarDelete(cotacao: any) {
    this.cotacaoSelecionadaParaDelete = cotacao;
  }

  deletarCotacao() {
    if (!this.cotacaoSelecionadaParaDelete) return;

    const id = this.cotacaoSelecionadaParaDelete.idCotacao;
    const endpoint = `${this.baseUrlCotacoes}/deletar/${id}`;

    this.http.delete(endpoint).subscribe({
      next: () => {
        this.tipoMensagem.set('success');
        this.mensagemPagPrincipal.set('Cotação deletada com sucesso.');
        this.cotacaoSelecionadaParaDelete = null;

        this.consultarCotacoes(this.paginaAtual());
        setTimeout(() => this.mensagemPagPrincipal.set(''), 3000);
      },
      error: (e: any) => {
        this.tipoMensagem.set('danger');
        this.mensagemPagPrincipal.set(e?.error?.message || 'Erro ao deletar cotação.');
      }
    });
  }
}
