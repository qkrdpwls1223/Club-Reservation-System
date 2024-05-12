from flask import Flask, render_template, redirect, url_for, request, jsonify
from datetime import datetime, timedelta
from dotenv import load_dotenv
import json
import os
import MySQLdb

import logging
import os

# 2. 로그 저장 폴더. 없을 시 생성
if not os.path.isdir('logs'):
  os.mkdir('logs')
  
# 3. 기본 설정된 werkzeug 로그 끄기
logging.getLogger('werkzeug').disabled = True

# 4. 로거 설정
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)  # 로거의 최소 로그 레벨 설정

# 콘솔 핸들러 생성 및 설정
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)
console_formatter = logging.Formatter('%(asctime)s:%(levelname)s:%(message)s', '%Y/%m/%d %H:%M:%S')
console_handler.setFormatter(console_formatter)
logger.addHandler(console_handler)

# 파일 핸들러 생성 및 설정
file_handler = logging.FileHandler("logs/server.log", encoding='utf-8')
file_handler.setLevel(logging.DEBUG)
file_formatter = logging.Formatter('%(asctime)s:%(levelname)s:%(message)s', '%Y/%m/%d %H:%M:%S')
file_handler.setFormatter(file_formatter)
logger.addHandler(file_handler)

# Load environment variables from the .env file
load_dotenv(dotenv_path="database.env")

# Connect to the database
connection = MySQLdb.connect(
  host=os.getenv("DATABASE_HOST"),
  port=int(os.getenv("DATABASE_PORT")),
  user=os.getenv("DATABASE_USERNAME"),
  passwd=os.getenv("DATABASE_PASSWORD"),
  db=os.getenv("DATABASE"),
  autocommit=True
)

def db_connect(sql):
    try:
        # Create a cursor to interact with the database
        cursor = connection.cursor()

        # Execute "SHOW TABLES" query
        #print(sql)
        cursor.execute(sql)
        # Fetch all the rows
        result = cursor.fetchall()

        # Close the cursor and connection
        cursor.close()
        return result

    except MySQLdb.Error as e:
        cursor.close()
        raise MySQLdb.Error
        
app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False  # 유니코드 설정

schedules = []

class Schedule:
    songName = ''
    userName = ''
    date = '2000-01-01'
    startTime = '06:00'
    endTime = '07:00'

def get_week_dates(date):
    #print("date:", date.weekday())
    # 현재 날짜의 요일을 가져오고, 일요일이면 0, 토요일이면 6
    current_weekday = date.weekday()

    # if current_weekday == 6:
    #     sunday = date
    # else:
    sunday = date - timedelta(days=current_weekday)
    # 현재 날짜로부터 일요일까지의 날짜를 계산
    #print("오늘", sunday)
    # 토요일까지의 날짜를 계산
    saturday = sunday + timedelta(days=6)

    return sunday.date(), saturday.date()

def format_time(time):
    
    return time.split(':')[0].zfill(2) + ":" + time.split(':')[1].zfill(2)

@app.route('/')
def root():
    return redirect('schedule')

@app.route('/schedule')
def index():
    date_str = request.args.get("day")
    #print(date_str)
    
    # 값을 입력했으면 입력한대로, 아니면 오늘
    if date_str == None:
        sun, sat = get_week_dates(datetime.now())
    else:
        sun, sat = get_week_dates(datetime.strptime(date_str, "%Y-%m-%d"))


    #print(sun, "~", sat)
    try:
        result = db_connect(f"""
            SELECT * FROM schedule
            WHERE date BETWEEN '{sun}' AND '{sat}';
                """)
    except MySQLdb.Error as e:
        app.logger.error("요청실패: DB 연결 실패")
        app.logger.error(e)
        return jsonify({"error": "서버 오류로 인해 요청을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요."}), 500
    #print(result)

    schedule = []

    for row in result:
        parsed_date = row[1].strftime("%Y-%m-%d")
        dict = {'date': parsed_date, 'startTime': row[2], 'endTime': row[3], 'songName': row[4], 'userName': row[5], 'color': row[6]}
        schedule.append(json.dumps(dict))
    #print(schedule)
    
    return render_template("index.html", schedule=schedule, start_day=sun, end_day=sat)

@app.route('/mentoring')
def mentor():
    date_str = request.args.get("day")
    #print(date_str)
    
    # 값을 입력했으면 입력한대로, 아니면 오늘
    if date_str == None:
        sun, sat = get_week_dates(datetime.now())
    else:
        sun, sat = get_week_dates(datetime.strptime(date_str, "%Y-%m-%d"))


    #print(sun, "~", sat)
    result = db_connect(f"""
        SELECT * FROM schedule
        WHERE date BETWEEN '{sun}' AND '{sat}';
               """)
    schedule = []

    for row in result:
        parsed_date = row[1].strftime("%Y-%m-%d")
        dict = {'date': parsed_date, 'startTime': row[2], 'endTime': row[3], 'songName': row[4], 'userName': row[5], 'color': row[6]}
        schedule.append(json.dumps(dict))

    return render_template("mentoring.html", schedule=schedule, start_day=sun, end_day=sat)

@app.route('/reservation', methods=['POST'])
def reservation():
    app.logger.info(f'[{request.method}] {request.path}')
    try:
        new_schedule = save_reserve(request.json)

        if new_schedule == "overlap":
            app.logger.info("예약중복: " +  request.json['date'] + ", " + request.json['startTime'] + "~" + request.json['endTime'])
            return "overlap"
        elif type(new_schedule) == Schedule:
            schedules.append(new_schedule)
            app.logger.info("예약성공: " + new_schedule.songName + ", " + new_schedule.date + ", " + new_schedule.startTime + "~" + new_schedule.endTime)
    except Exception as e:
        app.logger.error("예약실패: " +  request.json['date'] + ", " + request.json['startTime'] + "~" + request.json['endTime'])
        app.logger.error(e)

        return "fail"
    return "success"

@app.route('/reservation/multiple', methods=['POST'])
def multi_reservation():
    app.logger.info(f'[{request.method}] {request.path}')
    results = ''

    for data in request.json:
        try:
            new_schedule = save_reserve(data)
            if new_schedule == "overlap":
                # print("overlap")
                results += data['date'] + ": " + "예약 시간 중복\n"
                app.logger.info("예약중복: " + data['date'] + ", " + data['startTime'] + "~" + data['endTime'])
            elif type(new_schedule) == Schedule:
                schedules.append(new_schedule)
                results += data['date'] + ": " + "예약 성공\n"
                app.logger.info("예약성공: " + new_schedule.songName + ", " + new_schedule.date + ", " + new_schedule.startTime + "~" + new_schedule.endTime)
        except Exception as e:
            app.logger.error("예약실패: " +  data['date'] + ", " + data['startTime'] + "~" + data['endTime'])
            app.logger.error(e)

            results += data['date'] + ": " + "예약 실패\n"
    return results

def save_reserve(json_data):
    _songName = json_data['songName']
    _userName = json_data['userName']
    _date = json_data['date']
    _startTime = json_data['startTime']
    _endTime = json_data['endTime']
    _color = json_data['color']

    result = db_connect(f"""
    SELECT * FROM schedule
    WHERE date = '{_date}';
            """)
    if result:
        # print(result)
        for row in result:
            # print(row)
            if row[2] <= _startTime and row[3] > _startTime:
                # print("예약중복")
                return "overlap"
            elif row[2] < _endTime and row[3] >= _endTime:
                # print("예약중복")
                return "overlap"
    

    new_schedule = Schedule()
    new_schedule.songName = _songName
    new_schedule.userName = _userName
    new_schedule.date = _date
    new_schedule.startTime = format_time(_startTime)
    new_schedule.endTime = format_time(_endTime)

    result = db_connect(f"INSERT INTO schedule (date, startTime, endTime, songName, userName, color) VALUES ('{_date}', '{new_schedule.startTime}', '{new_schedule.endTime}', '{_songName}', '{_userName}', '{_color}');")

    return new_schedule

@app.route('/cancel', methods=["DELETE"])
def cancel():
    try:
        _name = request.json['name']
        _date = request.json['date']
        _startTime = request.json['startTime']
        _endTime = request.json['endTime']

        result = db_connect(f"""
        DELETE FROM schedule
        WHERE date = '{_date}' AND startTime = '{_startTime}' AND endTime = '{_endTime}';
               """)
        app.logger.info("예약취소: " + _date + ", " + _startTime + "~" + _endTime)
    except:
        app.logger.error("예약취소 실패: " + _date, ", " + _startTime + "~" + _endTime)
        return "fail"
    return "success"

if __name__ == '__main__':
    app.debug = True
    app.logger.info("server on :: PORT=5000")
    app.run(host='0.0.0.0', port=5000)
