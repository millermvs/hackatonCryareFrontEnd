import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-fornecedores',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './fornecedores.html',
  styleUrl: './fornecedores.css',
})
export class Fornecedores {

  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  // hackathon: id fixo (troca depois pelo logado)
  idEmpresa: number = 1;

  // ===================== MENSAGENS =====================
  mensagemPagPrincipal = signal<string>('');
  mensagemModal = signal<string>('');
  tipoMensagem = signal<string>(''); // success | danger

  // ===================== PAGINAÇÃO =====================
  paginaAtual = signal<number>(0);
  totalPaginas = signal<number>(0);
  readonly tamanhoPagina = 10;

  // ===================== LISTAS =====================
  fornecedores = signal<any[]>([]);
  fornecedoresFounds = signal<any[]>([]);
  ativarBodyPesquisa = signal<boolean>(false);

  // ===================== SELECIONADOS (EDIT/DELETE) =====================
  fornecedorSelecionadoParaEditar: any = null;
  fornecedorSelecionadoParaExcluir: any = null;

  // ===================== MODAIS (BOTÕES HIDDEN FECHAR) =====================
  @ViewChild('btnCloseAddFornecedorModal')
  btnCloseAddFornecedorModal!: ElementRef<HTMLButtonElement>;

  @ViewChild('btnCloseEditFornecedorModal')
  btnCloseEditFornecedorModal!: ElementRef<HTMLButtonElement>;

  @ViewChild('btnCloseExcluirFornecedorModal')
  btnCloseExcluirFornecedorModal!: ElementRef<HTMLButtonElement>;

  // ===================== URL BASE =====================
  private readonly baseUrl = `${environment.api.fornecedores}`;

  // ===================== FORMS =====================
  formPesquisarFornecedor = this.fb.group({
    tipoServico: [''] // vazio = todos
  });

  formAddFornecedor = this.fb.group({
    nomeFornecedor: ['', [Validators.required, Validators.pattern('^.{1,100}$')]],
    cnpjFornecedor: ['', [Validators.required, Validators.pattern('^.{1,30}$')]],
    whatsAppFornecedor: ['', [Validators.required, Validators.pattern('^.{8,30}$')]],
    emailFornecedor: ['', [Validators.required, Validators.email, Validators.pattern('^.{1,120}$')]],
    tipoServico: ['', [Validators.required]]
  });

  formEditFornecedor = this.fb.group({
    nomeFornecedor: ['', [Validators.required, Validators.pattern('^.{1,100}$')]],
    cnpjFornecedor: ['', [Validators.required, Validators.pattern('^.{1,30}$')]],
    whatsAppFornecedor: ['', [Validators.required, Validators.pattern('^.{8,30}$')]],
    emailFornecedor: ['', [Validators.required, Validators.email, Validators.pattern('^.{1,120}$')]],
    tipoServico: ['', [Validators.required]]
  });

  ngOnInit() {
    this.consultarFornecedores(this.paginaAtual());
  }

  // ===================== LISTAR (PAGINADO) =====================
  consultarFornecedores(page: number) {
    // ✅ ENDPOINT EXATAMENTE COMO VOCÊ PEDIU
    const endpoint =
      `http://localhost:8080/api/v1/empresas/consultar/fornecedores?${page}`;

    this.http.get(endpoint).subscribe({
      next: (response: any) => {
        this.ativarBodyPesquisa.set(false);
        this.formPesquisarFornecedor.get('tipoServico')?.setValue('');

        this.fornecedores.set(response.content ?? []);
        this.paginaAtual.set(response.number ?? 0);
        this.totalPaginas.set(response.totalPages ?? 0);

        this.mensagemPagPrincipal.set('');
      },
      error: (e: any) => {
        this.tipoMensagem.set('danger');
        this.mensagemPagPrincipal.set(e?.error?.message || 'Erro ao buscar fornecedores.');
      }
    });
  }

  // ✅ AQUI ESTÁ A PAGINAÇÃO CERTA
  irParaPagina(page: number): void {
    if (page < 0 || page >= this.totalPaginas()) return;

    // Se estiver pesquisando, pagina a pesquisa
    if (this.ativarBodyPesquisa()) {
      this.pesquisarFornecedorPorTipo(page);
      return;
    }

    // Senão pagina a listagem normal
    this.consultarFornecedores(page);
  }

  totalPaginasArray(): number[] {
    return Array.from({ length: this.totalPaginas() }, (_, i) => i);
  }

  // ===================== PESQUISAR POR TIPO (PAGINADO) =====================
  pesquisarFornecedorPorTipo(page: number = 0) {
    const tipo = this.formPesquisarFornecedor.value.tipoServico;

    if (!tipo) {
      this.consultarFornecedores(0);
      return;
    }

    const endpoint =
      `${this.baseUrl}/listar/tipo?tipoServico=${tipo}&page=${page}&size=10`;

    this.http.get(endpoint).subscribe({
      next: (response: any) => {
        this.fornecedoresFounds.set(response.content ?? []);
        this.ativarBodyPesquisa.set(true);

        this.paginaAtual.set(response.number ?? 0);
        this.totalPaginas.set(response.totalPages ?? 0);

        this.mensagemPagPrincipal.set('');
      },
      error: (e: any) => {
        this.fornecedoresFounds.set([]);
        this.ativarBodyPesquisa.set(true);

        this.paginaAtual.set(0);
        this.totalPaginas.set(0);

        this.tipoMensagem.set('danger');
        this.mensagemPagPrincipal.set(
          e?.error?.message || 'Nenhum fornecedor encontrado para esse tipo.'
        );
      }
    });
  }

  // ===================== CADASTRAR =====================
  addFornecedor() {
    if (this.formAddFornecedor.invalid) {
      this.formAddFornecedor.markAllAsTouched();
      return;
    }

    const payload = {
      idEmpresa: this.idEmpresa,
      nomeFornecedor: this.formAddFornecedor.value.nomeFornecedor?.trim(),
      cnpjFornecedor: this.formAddFornecedor.value.cnpjFornecedor?.trim(),
      whatsAppFornecedor: this.formAddFornecedor.value.whatsAppFornecedor?.trim(),
      emailFornecedor: this.formAddFornecedor.value.emailFornecedor?.trim(),
      tipoServico: this.formAddFornecedor.value.tipoServico
    };

    const endpoint = `${this.baseUrl}/cadastrar`;

    this.http.post(endpoint, payload).subscribe({
      next: (_: any) => {
        this.tipoMensagem.set('success');
        this.mensagemPagPrincipal.set('Fornecedor cadastrado com sucesso.');

        this.formAddFornecedor.reset();
        this.mensagemModal.set('');
        this.btnCloseAddFornecedorModal?.nativeElement.click();

        // ✅ RECARREGA A LISTAGEM NA PÁGINA ATUAL
        this.consultarFornecedores(this.paginaAtual());

        setTimeout(() => this.mensagemPagPrincipal.set(''), 3000);
      },
      error: (e: any) => {
        this.tipoMensagem.set('danger');
        this.mensagemModal.set(e?.error?.message || 'Erro ao cadastrar fornecedor.');
        setTimeout(() => this.mensagemModal.set(''), 3000);
      }
    });
  }

  // ===================== ABRIR MODAL EDITAR =====================
  abrirModalEditarFornecedor(fornecedor: any) {
    this.fornecedorSelecionadoParaEditar = fornecedor;

    this.formEditFornecedor.patchValue({
      nomeFornecedor: fornecedor?.nomeFornecedor ?? '',
      cnpjFornecedor: fornecedor?.cnpjFornecedor ?? '',
      whatsAppFornecedor: fornecedor?.whatsAppFornecedor ?? '',
      emailFornecedor: fornecedor?.emailFornecedor ?? '',
      tipoServico: fornecedor?.tipoServico ?? ''
    });

    this.mensagemModal.set('');
  }

  // ===================== EDITAR =====================
  editarFornecedor() {
    if (this.formEditFornecedor.invalid) {
      this.formEditFornecedor.markAllAsTouched();
      return;
    }

    if (!this.fornecedorSelecionadoParaEditar) return;

    const idFornecedor =
      this.fornecedorSelecionadoParaEditar.idFornecedor ??
      this.fornecedorSelecionadoParaEditar.id;

    const payload = {
      nomeFornecedor: this.formEditFornecedor.value.nomeFornecedor?.trim(),
      cnpjFornecedor: this.formEditFornecedor.value.cnpjFornecedor?.trim(),
      whatsAppFornecedor: this.formEditFornecedor.value.whatsAppFornecedor?.trim(),
      emailFornecedor: this.formEditFornecedor.value.emailFornecedor?.trim(),
      tipoServico: this.formEditFornecedor.value.tipoServico
    };

    const endpoint = `${this.baseUrl}/editar/${idFornecedor}`;

    this.http.put(endpoint, payload).subscribe({
      next: (_: any) => {
        this.tipoMensagem.set('success');
        this.mensagemPagPrincipal.set('Fornecedor atualizado com sucesso.');

        this.mensagemModal.set('');
        this.btnCloseEditFornecedorModal?.nativeElement.click();

        this.fornecedorSelecionadoParaEditar = null;

        // ✅ RECARREGA NA PÁGINA ATUAL
        this.consultarFornecedores(this.paginaAtual());

        setTimeout(() => this.mensagemPagPrincipal.set(''), 3000);
      },
      error: (e: any) => {
        this.tipoMensagem.set('danger');
        this.mensagemModal.set(e?.error?.message || 'Erro ao editar fornecedor.');
        setTimeout(() => this.mensagemModal.set(''), 3000);
      }
    });
  }

  // ===================== ABRIR MODAL EXCLUIR =====================
  abrirModalExcluirFornecedor(fornecedor: any) {
    this.fornecedorSelecionadoParaExcluir = fornecedor;
    this.mensagemModal.set('');
  }

  // ===================== EXCLUIR =====================
  excluirFornecedor() {
    if (!this.fornecedorSelecionadoParaExcluir) return;

    const idFornecedor =
      this.fornecedorSelecionadoParaExcluir.idFornecedor ??
      this.fornecedorSelecionadoParaExcluir.id;

    const endpoint = `${this.baseUrl}/deletar/fornecedor/${idFornecedor}`;

    this.http.delete(endpoint).subscribe({
      next: (_: any) => {
        this.tipoMensagem.set('success');
        this.mensagemPagPrincipal.set('Fornecedor excluído com sucesso.');

        this.fornecedorSelecionadoParaExcluir = null;

        this.btnCloseExcluirFornecedorModal?.nativeElement.click();

        // ✅ RECARREGA A PÁGINA ATUAL
        this.consultarFornecedores(this.paginaAtual());

        setTimeout(() => this.mensagemPagPrincipal.set(''), 3000);
      },
      error: (e: any) => {
        this.tipoMensagem.set('danger');
        this.mensagemModal.set(e?.error?.message || 'Erro ao excluir fornecedor.');
        setTimeout(() => this.mensagemModal.set(''), 3000);
      }
    });
  }
}
