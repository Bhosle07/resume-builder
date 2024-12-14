import { Routes } from '@angular/router';
import { ResumeBuilderComponent } from './resume-builder/resume-builder.component';
import { LoginComponent } from './login/login.component';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
{
    path:'',
    redirectTo:'/login',
    pathMatch:'full'
},
{
    path:'login',
    component:LoginComponent
},
{
    path:'',
    component: LayoutComponent,
    children: [
      {
        path:'dashboard',
        component:ResumeBuilderComponent
      }
    ]
  }

];
