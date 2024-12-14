import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ResumeBuilderComponent } from "../resume-builder/resume-builder.component";

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [ResumeBuilderComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {

  loggedUser: any;
  constructor(private router: Router) {
    const localUser = localStorage.getItem('loggedUser');
    if(localUser != null) {
      this.loggedUser = JSON.parse(localUser);
    }
  }

  onLogoff() {
    localStorage.removeItem('loggedUser');
    this.router.navigateByUrl('/login')
  }
}
