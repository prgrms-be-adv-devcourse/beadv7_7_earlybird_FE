// `thumbnailUrl`은 file-service가 요청마다 새로 서명하는 5분짜리 presigned S3 GET URL이라,
// zustand persist로 localStorage에 영구 보관되는 채팅 메시지 안의 URL은 새로고침하거나
// 오래된 대화를 다시 열면 이미 만료돼있을 수 있다. 최초 로드 성공 시 안정적인 키(projectId)로
// 이미지 blob 자체를 IndexedDB에 캐시해두고, 재로딩 시 캐시를 먼저 확인해 이 문제를 우회한다.
const DB_NAME = "earlybird-chat-thumbnails";
const STORE_NAME = "thumbnails";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 시크릿 모드, IndexedDB 비활성화, 저장 공간 부족 등으로 언제든 실패할 수 있다 — 이 캐시는
// 어디까지나 있으면 좋은 최적화라, 실패하면 그냥 캐시 없이(=매번 원본 URL로) 동작하면 된다.
export async function getCachedThumbnail(projectId: number): Promise<Blob | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).get(projectId);
      request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

export async function cacheThumbnail(projectId: number, blob: Blob): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(blob, projectId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // best-effort — 캐시 실패해도 화면엔 원본 URL로 정상 표시된다.
  }
}

// 캐시를 지울 트리거가 없으면 방문한 모든 프로젝트의 썸네일 blob이 브라우저에 무한정 쌓인다
// — "새 채팅"(resetChatSession)이나 로그인/로그아웃으로 대화가 초기화되는 시점(store.ts의
// resetMessages)에 같이 비운다.
export async function clearThumbnailCache(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // best-effort — 못 지워도 다음 캐싱 때 덮어써지는 것뿐이라 치명적이지 않다.
  }
}
