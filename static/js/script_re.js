document.addEventListener('DOMContentLoaded', function() {
    const calendarContainer = document.getElementById('calendar-container');
    const daysOfWeekContainer = document.getElementById('days-of-week');
    const monthYearDisplay = document.getElementById('month-year');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    const selectedDateTime = document.getElementById('selected-date-time');
    const selectedDateElem = document.getElementById('selected-date');
    const selectedTimeElem = document.getElementById('selected-time');
    let today = new Date();
    let month = today.getMonth();
    let year = today.getFullYear();

    function createCalendar(month, year) {
        calendarContainer.innerHTML = '';
        daysOfWeekContainer.innerHTML = '';
        const firstDay = new Date(year, month).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Update month and year display
        monthYearDisplay.textContent = `${year}년 ${month + 1}월`;

        // Create header for days of the week
        const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
        daysOfWeek.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.textContent = day;
            daysOfWeekContainer.appendChild(dayHeader);
        });

        // Create empty slots for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            const emptySlot = document.createElement('div');
            calendarContainer.appendChild(emptySlot);
        }

        // Create slots for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const daySlot = document.createElement('div');
            daySlot.textContent = day;
            daySlot.className = 'date-slot';
            daySlot.addEventListener('click', function() {
                document.querySelectorAll('.date-slot').forEach(function(slot) {
                    slot.classList.remove('selected');
                });
                
                daySlot.classList.add('selected');
                document.getElementById('time-selection').style.display = 'block';
                const selectedDate = `${year}-${month + 1}-${day}`;
                document.getElementById('time-selection').setAttribute('data-date', selectedDate);
                selectedDateElem.textContent = `${selectedDate}`;
                selectedDateTime.style.display = 'block';

                document.getElementById('reservation-form').style.display = 'none';
                document.getElementById('cancel-form').style.display = 'none';
                document.getElementById('selected-time').textContent = '';


                populateTimeButtons(selectedDate);
            });
            calendarContainer.appendChild(daySlot);
        }
    }

    function fetchData(selectedDate) {
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();

            xhr.open('GET', '/schedule?day='+selectedDate);
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4) {
                    if (xhr.status === 200) {
                        try {
                            const data = JSON.parse(xhr.responseText);
                            resolve(data); // 데이터를 resolve
                        } catch (error) { 
                            reject("JSON 파싱 에러: " + error);
                        }
                    } else {
                        reject("서버 오류: " + xhr.status);
                    }
                }
            };
            xhr.send();
        });
    }

    function populateTimeButtons(selectedDate) {
        const timeButtonsAm = document.getElementById('time-buttons-am');
        const timeButtonsPm = document.getElementById('time-buttons-pm');
        timeButtonsAm.innerHTML = ''; // Clear existing buttons
        timeButtonsPm.innerHTML = ''; // Clear existing buttons

        const timesAm = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00'];
        const timesPm = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];

        fetchData(selectedDate)
        .then(data => {
            timesAm.forEach(function(time) {
                const button = document.createElement('button');
                button.className = 'time-slot';
                button.textContent = time;
                for (const e of data) {
                    var row = JSON.parse(e)
                    if (row.startTime == time) {
                        button.style.backgroundColor = 'gray';
                        button.textContent = row.songName;
                        button.value = row.userName;
                    }
                }
                button.setAttribute('data-time', time);

                button.addEventListener('click', function() {
                    document.querySelectorAll('.time-slot').forEach(function(slot) {
                        slot.classList.remove('selected');
                    });
                    button.classList.add('selected');

                    if (button.style.backgroundColor == 'gray') {
                        document.getElementById('reservation-form').style.display = 'none';
                        document.getElementById('cancel-form').style.display = 'block';
                        document.getElementById('cancel-team-name').textContent = '팀명: ' + button.textContent;
                        document.getElementById('cancel-user-name').textContent = '대표자 이름: ' + button.value;
                    } else {
                        document.getElementById('reservation-form').style.display = 'block';
                        document.getElementById('cancel-form').style.display = 'none';
                    }
                    const selectedTime = time;
                    document.getElementById('reservation-form').setAttribute('data-time', selectedTime);
                    selectedTimeElem.textContent = `${selectedTime}`;
                });

                timeButtonsAm.appendChild(button);
            });
    
            timesPm.forEach(function(time) {
                const button = document.createElement('button');
                button.className = 'time-slot';
                button.textContent = time;
                for (const e of data) {
                    var row = JSON.parse(e)
                    if (row.startTime == time) {
                        button.style.backgroundColor = 'gray';
                        button.textContent = row.songName;
                        button.value = row.userName;
                    }
                }
                button.setAttribute('data-time', time);
                
                button.addEventListener('click', function() {
                    document.querySelectorAll('.time-slot').forEach(function(slot) {
                        slot.classList.remove('selected');
                    });
                    button.classList.add('selected');
                    if (button.style.backgroundColor == 'gray') {
                        document.getElementById('reservation-form').style.display = 'none';
                        document.getElementById('cancel-form').style.display = 'block';
                        document.getElementById('cancel-team-name').textContent = '팀명: ' + button.textContent;
                        document.getElementById('cancel-user-name').textContent = '대표자 이름: ' + button.value;
                    } else {
                        document.getElementById('reservation-form').style.display = 'block';
                        document.getElementById('cancel-form').style.display = 'none';
                    }
                    const selectedTime = time;
                    document.getElementById('reservation-form').setAttribute('data-time', selectedTime);
                    selectedTimeElem.textContent = `${selectedTime}`;
                });

                timeButtonsPm.appendChild(button);
            });
        })
        .catch(error => {
            console.error(error);
        });

        
    }

    prevMonthButton.addEventListener('click', function() {
        if (month === 0) {
            month = 11;
            year--;
        } else {
            month--;
        }
        createCalendar(month, year);
    });

    nextMonthButton.addEventListener('click', function() {
        if (month === 11) {
            month = 0;
            year++;
        } else {
            month++;
        }
        createCalendar(month, year);
    });

    createCalendar(month, year);
});

function reservation(jsonData) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/reservation', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                console.log("리스폰: ", xhr.responseText)
                if (xhr.responseText == "success") {            
                    alert(`${jsonData.userName}님, ${jsonData.date} ${jsonData.startTime}에 예약되었습니다. 팀명: ${jsonData.songName}`);
                } else {
                    alert('예약 실패');
                }
            } else {
                alert('예약 실패');
            }
        }
    };
    xhr.send(JSON.stringify(jsonData));
}

document.getElementById('submit-button').addEventListener('click', function() {
    const teamName = document.getElementById('team-name').value;
    const userName = document.getElementById('user-name').value;
    const date = document.getElementById('time-selection').getAttribute('data-date');
    const time = document.getElementById('reservation-form').getAttribute('data-time');

    if (teamName && userName && date && time) {
        // Save reservation to local storage
        var jsonData = {
            songName: teamName,
            userName: userName,
            date: date,
            startTime: time,
            endTime: time.split(":")[0] + ":50",
        }
        reservation(jsonData)
        
        // Refresh the time buttons to reflect the new reservation
    } else {
        alert('모든 필드를 입력해주세요.');
    }
});

document.getElementById('cancel-button').addEventListener('click', function() {
    const selectedDate = document.getElementById('selected-date').textContent;
    const selectedTime = document.getElementById('selected-time').textContent;

    var jsonData = {
        date: selectedDate,
        startTime: selectedTime,
        endTime: selectedTime.split(":")[0] + ":50",
    }

    var xhr = new XMLHttpRequest();
        xhr.open('DELETE', '/cancel');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    console.log("리스폰: ", xhr.responseText)
                    if (xhr.responseText == "success") {
                        alert('예약 취소 완료');
                    } else {
                        alert('취소 실패');
                    }
                } else {
                    alert('취소 실패');
                }
            }
                
        };
        xhr.send(JSON.stringify(jsonData));
});