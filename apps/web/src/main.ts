import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

const savedTheme = typeof localStorage !== 'undefined' ? localStorage.getItem('devzen-theme') : null;
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
}

bootstrapApplication(App, appConfig).catch((err) =>
  console.error(err)
);
