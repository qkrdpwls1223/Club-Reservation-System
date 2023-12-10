### 라이브러리 설치
#### pip insatll -r requirment.txt
### 실행
#### sudo apt-get install gunicorn
#### gunicorn -w 4 -b 0.0.0.0:5000 app:app
### 필요한 파일
#### DB연결에 필요한 .pem 파일
#### DB 계정 정보가 있는 .env 파일