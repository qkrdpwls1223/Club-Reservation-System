from dotenv import load_dotenv

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

try:
    # Create a cursor to interact with the database
    cursor = connection.cursor()

    # Execute "SHOW TABLES" query
    # cursor.execute("""INSERT INTO schedule(date, startTime, endTime, name)
    #     VALUES ('2023-11-17', '06:00', '07:00', 'ㅇㅇ');""")
    cursor.execute("select * from schedule;")
    # Fetch all the rows
    result = cursor.fetchall()

    # Print out the result
    for row in result:
        print(row)

except MySQLdb.Error as e:
    print("MySQL Error:", e)

finally:
    # Close the cursor and connection
    cursor.close()
    connection.close()
