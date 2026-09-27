import '../styles/tokens.css';
import '../styles/components.css';
import '../styles/documents.css';
import { initI18n, t, translateDom } from '../i18n';
import { initSiteNav } from '../shared/nav';
import esDocuments from '../i18n/locales/es/documents.json';

const renderSteps = (): void => {
  const mount = document.getElementById('stepList');
  if (!mount) return;
  const steps = t('documents:guide.steps', { returnObjects: true }) as unknown as string[];
  mount.innerHTML = steps
    .map(
      (step, index) => `
      <li class="step-item">
        <span class="step-number">${index + 1}</span>
        <p class="step-text">${step}</p>
      </li>`,
    )
    .join('');
};

const init = async (): Promise<void> => {
  await initI18n([{ locale: 'es', namespace: 'documents', resources: esDocuments }]);
  initSiteNav({ current: 'documents' });
  translateDom();
  renderSteps();
};

document.addEventListener('DOMContentLoaded', () => {
  void init();
});
