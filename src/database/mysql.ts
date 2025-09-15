// MySQL 연결 설정 (서버 사이드 전용)
// 클라이언트 사이드에서는 이 파일을 직접 사용하지 않고 API를 통해 데이터에 접근합니다.

console.log('📝 MySQL 연결 설정 파일이 로드되었습니다.');
console.log('⚠️  이 파일은 서버 사이드에서만 사용됩니다.');
console.log('💡 클라이언트에서는 API 호출을 통해 데이터에 접근하세요.');

// 클라이언트 사이드에서는 더미 함수들을 제공합니다.
export const testConnection = () => {
  console.log('🔍 MySQL 연결 테스트 (클라이언트 사이드에서는 API 호출을 사용하세요)');
  return Promise.resolve({ success: true, message: 'API를 통해 연결하세요' });
};

export const executeQuery = (query: string, params?: any[]) => {
  console.log('📊 쿼리 실행 (클라이언트 사이드에서는 API 호출을 사용하세요)');
  return Promise.resolve({ success: true, data: [] });
};

export const executeTransaction = (queries: Array<{ query: string; params?: any[] }>) => {
  console.log('🔄 트랜잭션 실행 (클라이언트 사이드에서는 API 호출을 사용하세요)');
  return Promise.resolve({ success: true, data: [] });
};

export default {
  testConnection,
  executeQuery,
  executeTransaction
};
