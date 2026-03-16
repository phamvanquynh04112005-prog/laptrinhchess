# Chess Master

Ung dung co frontend React o thu muc goc va backend Express + Socket.IO + MySQL trong `Backend/`.

## Cau truc

- Frontend: React Create React App
- Backend: Express, Socket.IO, MySQL
- Deploy khuyen nghi:
  - Frontend: Vercel
  - Backend: Render, Railway, VPS, hoac bat ky dich vu nao chay duoc Node server lau dai

## Chay local

Frontend:

```bash
npm install
npm start
```

Backend:

```bash
cd Backend
npm install
copy .env.example .env
npm run dev
```

## Bien moi truong frontend

Tao file `.env.local` o thu muc goc neu can:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

Neu khong khai bao, frontend se tu fallback ve `localhost:5000` khi chay local/LAN.

## Deploy frontend len Vercel

Repo da co san:

- `vercel.json` de build ra thu muc `build`
- rewrite moi route ve `index.html` cho React Router
- `.vercelignore` de khong upload `Backend/` va `node_modules/`

Sau khi backend da co URL public, them cac env sau trong Vercel:

```env
REACT_APP_API_URL=https://your-backend-service.example.com/api
REACT_APP_SOCKET_URL=https://your-backend-service.example.com
```

## Deploy backend

Backend hien tai khong phu hop de deploy truc tiep len Vercel vi:

- can Node server chay lien tuc
- dung Socket.IO real-time
- dung ket noi MySQL stateful

Can deploy `Backend/` sang Render, Railway, VPS, hoac dich vu tuong tu. Sau do cap nhat:

- `CORS_ORIGIN` = domain frontend Vercel
- thong tin MySQL (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`)
- `JWT_SECRET`

## Push len GitHub

Repo da duoc cau hinh de bo qua:

- `node_modules/`
- `Backend/node_modules/`
- `.env`
- `Backend/.env`

Neu cac file nay da tung bi track, can bo khoi git index truoc khi commit:

```bash
git rm -r --cached node_modules Backend/node_modules
git rm --cached Backend/.env
```
