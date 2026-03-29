# GitHub Actions 시크릿 설정 가이드

GitHub Repository → Settings → Secrets and variables → Actions 에서 아래 시크릿을 등록한다.

## 필수 시크릿

| 시크릿명 | 설명 | 획득 방법 |
|----------|------|-----------|
| `VERCEL_TOKEN` | Vercel API 토큰 | vercel.com → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel 팀/개인 ID | `vercel link` 실행 후 `.vercel/project.json` 확인 |
| `VERCEL_PROJECT_ID` | Vercel 프로젝트 ID | 동상 |
| `ORACLE_VM_HOST` | Oracle VM 공인 IP | Oracle Cloud 콘솔 → Compute → Instances → 해당 인스턴스 → Public IP Address |
| `ORACLE_VM_USER` | SSH 접속 유저명 | 보통 `ubuntu` 또는 `opc` |
| `ORACLE_VM_SSH_KEY` | SSH 개인키 (PEM) | `cat ~/.ssh/id_rsa` 또는 Oracle VM 키페어 |

## Oracle VM 최초 설정 (1회)

```bash
# VM에 SSH 접속 후
mkdir -p /app/swiss-italy-travel
cd /app
git clone https://github.com/jhshin68/swiss-italy-travel.git

# PM2 전역 설치
npm install -g pm2

# 백엔드 환경변수 설정
cp /app/swiss-italy-travel/backend/.env.example /app/swiss-italy-travel/backend/.env
# .env 파일에서 실제 값 입력
nano /app/swiss-italy-travel/backend/.env

# 초기 마이그레이션
cd /app/swiss-italy-travel/backend
npm ci
npm run migrate

# PM2로 서버 시작 + 재부팅 후 자동 시작 등록
pm2 start dist/index.js --name swiss-italy-api
pm2 save
pm2 startup
```
