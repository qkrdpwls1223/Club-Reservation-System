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

def get_week_dates():
    # 현재 날짜를 가져옴
    today = datetime.today()

    # 현재 날짜의 요일을 가져오고, 일요일이면 0, 토요일이면 6
    current_weekday = today.weekday()

    # 현재 날짜로부터 일요일까지의 날짜를 계산
    sunday = today - timedelta(days=current_weekday+1)

    # 토요일까지의 날짜를 계산
    saturday = sunday + timedelta(days=6)

    return sunday.date(), saturday.date()

def format_time(time):
    
    return time.split(':')[0].zfill(2) + ":" + time.split(':')[1].zfill(2)

@app.route('/')
def index():
    sun, sat = get_week_dates()
    print(sun, "~", sat)
    result = db_connect(f"""
        SELECT * FROM schedule
        WHERE date BETWEEN '{sun}' AND '{sat}';
               """)
    schedule = []

    for row in result:
        parsed_date = row[0].strftime("%Y-%m-%d")
        dict = {'date': parsed_date, 'startTime': row[1], 'endTime': row[2], 'name': row[3]}
        schedule.append(json.dumps(dict))
    print(schedule)
    return render_template("index.html", schedule=schedule)

@app.route('/test')
def test():
    return redirect(url_for("index"))


@app.route('/reservation', methods=['POST'])
def reservation():
    try:
        _name = request.json['name']
        _date = request.json['date']
        _startTime = request.json['startTime']
        _endTime = request.json['endTime']

        new_schedule = Schedule()
        new_schedule.name = _name
        new_schedule.date = _date
        new_schedule.startTime = format_time(_startTime)
        new_schedule.endTime = format_time(_endTime)

        result = db_connect(f"INSERT INTO schedule (date, startTime, endTime, name) VALUES ('{_date}', '{new_schedule.startTime}', '{new_schedule.endTime}', '{_name}');")

        schedules.append(new_schedule)
        print(new_schedule)

    except:
        print("예약실패")
        return redirect(url_for("fail"))
    print("예약완료.")
    return redirect(url_for("success"))

@app.route('/success')
def success():
    return render_template("success.html")

@app.route('/fail')
def fail():
    return render_template("fail.html")

if __name__ == '__main__':
    app.debug = True
    app.run(host='127.0.0.1', port=5000)