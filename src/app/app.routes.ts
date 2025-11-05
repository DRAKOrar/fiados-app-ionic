import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage)
  },
  {
    path: 'clientes',
    loadComponent: () => import('./pages/clientes/clientes.page').then(m => m.ClientesPage)
  },
  {
    path: 'agregar-cliente',
    loadComponent: () => import('./pages/agregar-cliente/agregar-cliente.page').then(m => m.AgregarClientePage)
  },
  {
    path: 'detalle-cliente/:id',
    loadComponent: () => import('./pages/detalle-cliente/detalle-cliente.page').then(m => m.DetalleClientePage)
  },
  {
    path: 'nueva-deuda/:clienteId',
    loadComponent: () => import('./pages/nueva-deuda/nueva-deuda.page').then(m => m.NuevaDeudaPage)
  },
  {
    path: 'detalle-deuda',
    loadComponent: () => import('./pages/detalle-deuda/detalle-deuda.page').then( m => m.DetalleDeudaPage)
  },
  {
    path: 'detalle-deuda/:id',
    loadComponent: () => import('./pages/detalle-deuda/detalle-deuda.page').then(m => m.DetalleDeudaPage)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.page').then( m => m.DashboardPage)
  },
  {
    path: 'busqueda',
    loadComponent: () => import('./pages/busqueda/busqueda.page').then( m => m.BusquedaPage)
  },
  {
    path: 'configuracion',
    loadComponent: () => import('./pages/configuracion/configuracion.page').then( m => m.ConfiguracionPage)
  },


];
