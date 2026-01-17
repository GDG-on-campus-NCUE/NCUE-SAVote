import { Buffer } from 'buffer';

// 確保在瀏覽器環境中有全域的 Buffer 和 global
// 這必須在任何其他依賴項加載之前執行
if (typeof window !== 'undefined') {
  window.global = window;
  window.Buffer = Buffer;
}
