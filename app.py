from flask import Flask, render_template, redirect, url_for, request
from datetime import datetime, timedelta
from dotenv import load_dotenv
import json

# Load environment variables from the .env file
load_dotenv()
import os
import MySQLdb

# Connect to the database
connection = MySQLdb.connect(
  host=os.getenv("DATABASE_HOST"),
  user=os.getenv("DATABASE_USERNAME"),
  passwd=os.getenv("DATABASE_PASSWORD"),
  db=os.getenv("DATABASE"),
  autocommit=True,
  ssl_mode="VERIFY_IDENTITY",
  # See https://planetscale.com/docs/concepts/secure-connections#ca-root-configuration
  # to determine the path to your operating systems certificate file.
  ssl={ "ca": "cacert-2023-08-22.pem" }
)

def db_connect(sql):
    try:
        # Create a cursor to interact with the database
        cursor = connection.cursor()

        # Execute "SHOW TABLES" query
        print(sql)
        cursor.execute(sql)
        # Fetch all the rows
        result = cursor.fetchall()

    except MySQLdb.Error as e:
        raise MySQLdb.Error
    finally:
        # Close the cursor and connection
        cursor.close()
        return result

app = Flask(__name__)

schedules = []

class Schedule:
    name = ''
    date = '2000-01-01'
    startTime = '06:00'
    endTime = '07:00'

def get_week_dates(date):
    print("date:", date.weekday())
    # 현재 날짜의 요일을 가져오고, 일요일이면 0, 토요일이면 6
    current_weekday = date.weekday()

    if current_weekday == 6:
        sunday = date
    else:
        sunday = date - timedelta(days=current_weekday + 1)
    # 현재 날짜로부터 일요일까지의 날짜를 계산
    print("오늘", sunday)
    # 토요일까지의 날짜를 계산
    saturday = sunday + timedelta(days=6)

    return sunday.date(), saturday.date()

def format_time(time):
    
    return time.split(':')[0].zfill(2) + ":" + time.split(':')[1].zfill(2)

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
    result = db_connect(f"""
        SELECT * FROM schedule
        WHERE date BETWEEN '{sun}' AND '{sat}';
               """)
    schedule = []

    for row in result:
        parsed_date = row[0].strftime("%Y-%m-%d")
        dict = {'date': parsed_date, 'startTime': row[1], 'endTime': row[2], 'name': row[3]}
        schedule.append(json.dumps(dict))
    # print(schedule)
    # print(sun)
    # print(sat)
    return render_template("index.html", schedule=schedule, start_day=sun, end_day=sat)

@app.route('/reservation', methods=['POST'])
def reservation():
    try:
        _name = request.json['name']
        _date = request.json['date']
        _startTime = request.json['startTime']
        _endTime = request.json['endTime']

        result = db_connect(f"""
        SELECT * FROM schedule
        WHERE date = '{_date}';
               """)
        if not result:
            print("넌")
        else:
            print(result)
            for row in result:
                print(row)
                if row[1] <= _startTime and row[2] > _startTime:
                    print("예약중복")
                    return "overlap"
                elif row[1] < _endTime and row[2] >= _endTime:
                    print("예약중복")
                    return "overlap"
        

        new_schedule = Schedule()
        new_schedule.name = _name
        new_schedule.date = _date
        new_schedule.startTime = format_time(_startTime)
        new_schedule.endTime = format_time(_endTime)

        result = db_connect(f"INSERT INTO schedule (date, startTime, endTime, name) VALUES ('{_date}', '{new_schedule.startTime}', '{new_schedule.endTime}', '{_name}');")

        schedules.append(new_schedule)
        print("새로운 스케줄 생성: ", _name,", ",_date,", ", new_schedule.startTime, "~", new_schedule.endTime)
    except:
        print("예약실패")
        return "fail"
    print("예약완료.")
    return "success"

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
        print("예약취소: ", _date, ", ", _startTime, "~", _endTime)
    except:
        print("예약취소실패")
        return "fail"
    print("예약취소완료.")
    return "success"

if __name__ == '__main__':
    app.debug = False
    app.run(host='0.0.0.0', port=5000)