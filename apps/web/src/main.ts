import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

const savedTheme = typeof localStorage !== 'undefined' ? localStorage.getItem('devzen-theme') : null;
const prefersDark = typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
if (savedTheme === 'dark' || (savedTheme !== 'light' && prefersDark)) {
  document.documentElement.classList.add('dark');
}

bootstrapApplication(App, appConfig).catch((err) =>
  console.error(err)
);
