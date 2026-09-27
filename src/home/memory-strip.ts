import { catalog, GROUP_ORDER } from '../memory/catalog';
import { escapeHtml, photoUrl } from '../memory/gallery';

const STRIP_SIZE = 6;

/** Shows one photo per gallery group (then fills up in catalog order) as a
 *  teaser linking to memoria.html. Stays hidden when the catalog is empty. */
export const renderMemoryStrip = (): void => {
  const mount = document.getElementById('memoryStrip');
  if (!mount || catalog.photos.length === 0) return;

  const firstOfEachGroup = GROUP_ORDER.flatMap((group) => catalog.photos.find((photo) => photo.group === group) ?? []);
  const rest = catalog.photos.filter((photo) => !firstOfEachGroup.includes(photo));
  const picks = [...firstOfEachGroup, ...rest].slice(0, STRIP_SIZE);

  mount.innerHTML = picks
    .map(
      (photo) => `
      <li>
        <a href="memoria.html#fotos">
          <img src="${photoUrl(photo.id, 'thumb')}" alt="${escapeHtml(photo.alt)}" loading="lazy" decoding="async" />
        </a>
      </li>`,
    )
    .join('');
  mount.hidden = false;
};
