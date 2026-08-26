import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DEMO_USERS, PreviewSessionService } from '../../../core/preview-session.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css',
})
export class LoginPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly session = inject(PreviewSessionService);
  readonly submitted = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly demoUsers = Object.values(DEMO_USERS);
  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    this.submitted.set(true);
    this.submitError.set(null);
    this.form.markAllAsTouched();

    if (this.form.invalid) return;

    const { email, password } = this.form.getRawValue();
    if (!this.session.login(email, password)) {
      this.submitError.set('El correo o la contraseña no son correctos.');
      return;
    }

    void this.router.navigateByUrl('/inicio');
  }

  hasError(controlName: 'email' | 'password'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || this.submitted());
  }
}
