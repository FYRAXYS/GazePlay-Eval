import { TestBed } from '@angular/core/testing';
import { IndexedDBService } from './indexed-db.service';

describe('IndexedDBService', () => {
  let service: IndexedDBService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [IndexedDBService]
    });

    service = TestBed.inject(IndexedDBService);
    await service.dbReady;
  });

  afterEach(async () => {
    await service.deleteAll();
  });

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  it('addFile → ajoute un fichier et getFile le retrouve', async () => {
    const file = new File(['contenu'], 'test.png', { type: 'image/png' });

    await service.addFile('projet/test.png', file, 'image');

    const result = await service.getFile('projet/test.png');

    expect(result.id).toBe('projet/test.png');
    expect(result.type).toBe('image');
    expect(result.file).toEqual(file);
  });

  it('addFile → rejette si l\'id existe déjà', async () => {
    const file = new File(['contenu'], 'test.png', { type: 'image/png' });

    await service.addFile('projet/test.png', file, 'image');

    await expectAsync(
      service.addFile('projet/test.png', file, 'image')
    ).toBeRejectedWithError(`L'id "projet/test.png" existe déjà`);
  });

  it('getFile → rejette si le fichier est introuvable', async () => {
    await expectAsync(
      service.getFile('projet/inexistant.png')
    ).toBeRejectedWithError('Fichier "projet/inexistant.png" introuvable');
  });

  it('getAllFiles → retourne tous les fichiers', async () => {
    const file1 = new File(['a'], 'a.png', { type: 'image/png' });
    const file2 = new File(['b'], 'b.mp3', { type: 'audio/mpeg' });

    await service.addFile('projet/a.png', file1, 'image');
    await service.addFile('projet/b.mp3', file2, 'sound');

    const result = await service.getAllFiles();

    expect(result.length).toBe(2);
  });

  it('updateFile → met à jour un fichier existant', async () => {
    const file = new File(['v1'], 'test.png', { type: 'image/png' });
    const fileV2 = new File(['v2'], 'test.png', { type: 'image/png' });

    await service.addFile('projet/test.png', file, 'image');
    await service.updateFile('projet/test.png', fileV2, 'image');

    const result = await service.getFile('projet/test.png');

    expect(result.file).toEqual(fileV2);
  });

  it('deleteFile → supprime un fichier', async () => {
    const file = new File(['contenu'], 'test.png', { type: 'image/png' });

    await service.addFile('projet/test.png', file, 'image');
    await service.deleteFile('projet/test.png');

    await expectAsync(
      service.getFile('projet/test.png')
    ).toBeRejected();
  });

  it('deleteAll → supprime tous les fichiers', async () => {
    const file1 = new File(['a'], 'a.png', { type: 'image/png' });
    const file2 = new File(['b'], 'b.png', { type: 'image/png' });

    await service.addFile('projet/a.png', file1, 'image');
    await service.addFile('projet/b.png', file2, 'image');

    await service.deleteAll();

    const result = await service.getAllFiles();
    expect(result.length).toBe(0);
  });

  it('changeID → renomme l\'id d\'un fichier', async () => {
    const file = new File(['contenu'], 'test.png', { type: 'image/png' });

    await service.addFile('projet/ancien.png', file, 'image');
    await service.changeID('projet/ancien.png', 'projet/nouveau.png');

    await expectAsync(service.getFile('projet/ancien.png')).toBeRejected();
    const result = await service.getFile('projet/nouveau.png');
    expect(result.id).toBe('projet/nouveau.png');
  });

  it('getFilesByProject → retourne uniquement les fichiers du projet', async () => {
    const file1 = new File(['a'], 'a.png', { type: 'image/png' });
    const file2 = new File(['b'], 'b.png', { type: 'image/png' });
    const file3 = new File(['c'], 'c.png', { type: 'image/png' });

    await service.addFile('projetA/a.png', file1, 'image');
    await service.addFile('projetA/b.png', file2, 'image');
    await service.addFile('projetB/c.png', file3, 'image'); // autre projet

    const result = await service.getFilesByProject('projetA');

    expect(result.length).toBe(2);
    expect(result.every(f => f.id.startsWith('projetA/'))).toBeTrue();
  });

  it('deleteFileByProject → supprime uniquement les fichiers du projet', async () => {
    const file1 = new File(['a'], 'a.png', { type: 'image/png' });
    const file2 = new File(['b'], 'b.png', { type: 'image/png' });
    const file3 = new File(['c'], 'c.png', { type: 'image/png' });

    await service.addFile('projetA/a.png', file1, 'image');
    await service.addFile('projetA/b.png', file2, 'image');
    await service.addFile('projetB/c.png', file3, 'image'); // ne doit pas être sup

    await service.deleteFileByProject('projetA');

    const remaining = await service.getAllFiles();
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe('projetB/c.png');
  });
});
