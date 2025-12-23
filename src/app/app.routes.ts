// app-routing.module.ts  (ou routes.ts se for standalone)

import { Routes } from '@angular/router';
import { Dashboard as EmpresaDashboard } from './empresa/pages/dashboard/dashboard';
import { Servicos as EmpresaServicos } from './empresa/pages/servicos/servicos';
import { Cotacoes as EmpresaCotacoes } from './empresa/pages/cotacoes/cotacoes';
import { Fornecedores as EmpresaFornecedores } from './empresa/pages/fornecedores/fornecedores';
import { DashboardComponent as FornecedorDashboard } from './fornecedor/pages/dashboard/dashboard';

export const routes: Routes = [

  {
    path: 'empresa',
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }, // ✅ ADD opcional
      { path: 'dashboard', component: EmpresaDashboard },
       { path: 'dashboard-fornecedores', component: FornecedorDashboard },
      { path: 'servicos', component: EmpresaServicos },
      { path: 'fornecedores', component: EmpresaFornecedores },
      { path: 'cotacoes', component: EmpresaCotacoes }
    ]
  },

  {
    path: 'fornecedor',
    children: [
     
       { path: 'dashboard-fornecedor', component: FornecedorDashboard }
    ]
  },


  { path: '', redirectTo: 'empresa/dashboard', pathMatch: 'full' },

  { path: '**', redirectTo: 'empresa/dashboard' }
];

