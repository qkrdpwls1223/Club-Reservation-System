document.addEventListener('DOMContentLoaded', function() {
    $('#calendar').fullCalendar({
        locale: 'ko',
        header: {
            left: 'prev',
            center: 'title',
            right: 'next'
        },
        editable: false,
        events: [],
        height: 'parent',
        showNonCurrentDates: true, // 다음 달 날짜 다시 표시
        fixedWeekCount: false // 빈 날짜 크기 늘리기
    });

    // flatpickr 날짜 선택기 적용
    flatpickr("#date", {
        locale: "ko",
        dateFormat: "Y-m-d",
    });

    flatpickr("#cancelDate", {
        locale: "ko",
        dateFormat: "Y-m-d",
    });

    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/schedule');
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            try {
                const data = JSON.parse(xhr.responseText);

                for (const e of data) {
                    var row = JSON.parse(e)

                    $('#calendar').fullCalendar('renderEvent', {
                        title: `${row.songName} (${row.userName})`,
                        start: `${row.date}T${row.startTime}:00`,
                        end: `${row.date}T${row.endTime}:00`,
                        allDay: false
                    }, true);
                }
            } catch (error) { 
                console.error("JSON 파싱 에러:", error);
            }
        }
    };
    xhr.send();



    document.getElementById('reservationForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const representativeName = document.getElementById('representativeName').value;
        const teamName = document.getElementById('teamName').value;
        const date = document.getElementById('date').value;
        const time = document.getElementById('time').value;

        const [startTime, endTime] = time.split('~');
        const startDateTime = `${date}T${startTime}:00`;
        const endDateTime = `${date}T${endTime}:00`;

        // 예약 겹침 확인
        const events = $('#calendar').fullCalendar('clientEvents');
        const isOverlap = events.some(event => {
            return (startDateTime < event.end.format() && endDateTime > event.start.format());
        });

        if (isOverlap) {
            alert('이미 예약된 시간입니다. 다른 시간을 선택해 주세요.');
            return;
        }

        // 같은 팀명이 하루에 두 개까지만 예약 가능
        const teamEvents = events.filter(event => event.start.format('YYYY-MM-DD') === date && event.title.includes(teamName));
        if (teamEvents.length >= 2) {
            alert('같은 팀명으로 하루에 두 개 이상의 예약을 할 수 없습니다.');
            return;
        }

        var jsonData = {
            songName: representativeName,
            userName: teamName,
            date: date,
            startTime: startTime,
            endTime: endTime,
        }

        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/reservation', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    console.log("리스폰: ", xhr.responseText)
                    if (xhr.responseText == "success") {
                        $('#calendar').fullCalendar('renderEvent', {
                            title: `${representativeName} (${teamName})`,
                            start: startDateTime,
                            end: endDateTime,
                            allDay: false
                        }, true);
                
                        document.getElementById('confirmationMessage').textContent = `${representativeName}님, ${date} ${time}에 예약되었습니다. 팀명: ${teamName}`;
                    } else {
                        document.getElementById('confirmationMessage').textContent = '예약 실패';
                    }
                } else {
                    document.getElementById('confirmationMessage').textContent = '예약 실패';
                }
            }
        };
        xhr.send(JSON.stringify(jsonData));
    });

    document.getElementById('cancelReservationForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const cancelTeamName = document.getElementById('cancelTeamName').value;
        const cancelDate = document.getElementById('cancelDate').value;
        const cancelTime = document.getElementById('cancelTime').value;

        const [startTime, endTime] = cancelTime.split('~');
        const startDateTime = `${cancelDate}T${startTime}:00`;
        const endDateTime = `${cancelDate}T${endTime}:00`;

        const events = $('#calendar').fullCalendar('clientEvents');
        const teamEvents = events.filter(event => event.start.format() === startDateTime && event.end.format() === endDateTime && event.title.includes(cancelTeamName));

        if (teamEvents.length === 0) {
            alert('해당 날짜와 시간에 예약된 팀이 없습니다.');
            return;
        }

        var jsonData = {
            date: cancelDate,
            startTime: startTime,
            endTime: endTime
        }

        var xhr = new XMLHttpRequest();
        xhr.open('DELETE', '/cancel');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    console.log("리스폰: ", xhr.responseText)
                    if (xhr.responseText == "success") {
                        teamEvents.forEach(event => {
                            $('#calendar').fullCalendar('removeEvents', event._id);
                        });
                        document.getElementById('confirmationMessage').textContent = '예약 취소';
                    } else {
                        document.getElementById('confirmationMessage').textContent = '취소 실패';
                    }
                } else {
                    document.getElementById('confirmationMessage').textContent = '취소 실패';
                }
            }
                
        };
        xhr.send(JSON.stringify(jsonData));

        

        document.getElementById('confirmationMessage').textContent = `${cancelTeamName} 팀의 ${cancelDate} ${cancelTime} 예약이 취소되었습니다.`;
    });
});
