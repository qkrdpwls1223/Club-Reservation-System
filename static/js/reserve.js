// 표시 기간 날짜
function setDayTerm(start, end) {
    const label = document.getElementById("day-term-label")
    label.innerHTML = start + " ~ " + end
}

function formatTime(hour) {
    return hour.toString().padStart(2, '0');
}

function sendJSON(songName, userName, date, startTime, endTime, callback) {
    // 예제 JSON 객체 생성
    var jsonData = {
        songName: songName,
        userName: userName,
        date: date,
        startTime: startTime,
        endTime: endTime,
        color: "#F7FE2E"
    };

    // AJAX를 사용하여 서버로 JSON 전송
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/reservation', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                console.log("리스폰: ", xhr.responseText)
                callback(xhr.responseText)
            } else {
                callback(false)
            }
        }
    };
    xhr.send(JSON.stringify(jsonData));
}

function sendJSONList(jsonList, callback) {
    // AJAX를 사용하여 서버로 JSON 전송
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/reservation/multiple', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                console.log("리스폰: ", xhr.responseText)
                callback(xhr.responseText)
            } else {
                callback(false)
            }
        }
    };

    // 전송 실패 시 실행되는 이벤트 핸들러
    function handleError() {
        console.error("전송 실패");
        callback(false);
        // 이벤트 핸들러 제거
        xhr.onerror = null;
    }
    
    xhr.onerror = handleError;

    xhr.send(JSON.stringify(jsonList));
}

function createSchedule() {
    var date = document.getElementById('datepicker').value
    var songName = document.getElementById('songName').value
    var userName = document.getElementById('userName').value
    var startTime = document.getElementById('startTime').value
    var endTime = document.getElementById('endTime').value

    //console.log(date)
    //console.log("시작시간: " + startTime + ", 종료시간: " + endTime)

    if (startTime == endTime) {
        alert("예약 실패: 시작시간과 종료시간이 같습니다.")
        return 0;
    } else if (endTime < startTime) {
        alert("예약 실패: 종료시간이 시작시간보다 빠릅니다.")
        return 0;
    } else if (songName == "") {
        alert("예약 실패: 노래이름을 입력해주세요.")
        return 0;
    } else if (userName == "") {
        alert("예약 실패: 대표이름을 입력해주세요.")
        return 0;
    }
    sendJSON(songName, userName, date, startTime, endTime, function (result) {
        if (result) {
            console.log("전송 성공")
            console.log("결과:", result)
            if (result == "success") {
                console.log("블럭 생성")
                alert("예약이 완료되었습니다.")
                location.reload();
            } else if (result == "overlap") {
                alert("예약 시간이 중복됩니다.")
            } else if (result == "fail") {
                alert("전송 오류: 박예진한테 카톡 문의 바람")
            }
        } else {
            alert("서버 오류: 박예진한테 카톡 문의 바람")
        }
    })
}

function createMentoring() {
    var startDay = document.getElementById('startDay').value
    var endDay = document.getElementById('endDay').value
    var week = document.getElementById('week').value
    var songName = document.getElementById('songName').value
    var userName = document.getElementById('userName').value
    var startHour = document.getElementById('startHour').value
    var startMin = document.getElementById('startMin').value
    var endHour = document.getElementById('endHour').value
    var endMin = document.getElementById('endMin').value

    var startTime = formatTime(startHour) + ":" + formatTime(startMin)
    var endTime = formatTime(endHour) + ":" + formatTime(endMin)
    // console.log(startDay + " ~ " + endDay)
    // console.log("시작시간: " + startTime + ", 종료시간: " + endTime)

    if (startTime == endTime) {
        alert("예약 실패: 시작시간과 종료시간이 같습니다.")
        return 0;
    } else if (endTime < startTime) {
        alert("예약 실패: 종료시간이 시작시간보다 빠릅니다.")
        return 0;
    } else if (songName == "") {
        alert("예약 실패: 수업명을 입력해주세요.")
        return 0;
    }

    const endDate = new Date(endDay);

    // 결과를 저장할 배열
    var resultDates = [];

    // 시작 날짜부터 종료 날짜까지 반복
    for (let currentDate = new Date(startDay); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
        // 현재 날짜의 요일을 가져옴 (0: 일요일, 1: 월요일, ..., 6: 토요일)
        const currentDay = currentDate.getDay();
        console.log(currentDate)
        
        // 만약 현재 날짜의 요일이 찾고자 하는 요일과 같다면 결과 배열에 추가
        if (currentDay == week) {
            resultDates.push(new Date(currentDate));
        }
    }
    // console.log(resultDates)

    let jsonList = []
    for (let date of resultDates) {
        var dateFormat = date.toISOString().split('T')[0];

        var jsonData = {
            songName: songName,
            userName: userName,
            date: dateFormat,
            startTime: startTime,
            endTime: endTime,
            color: "#58ACFA"
        };

        jsonList.push(jsonData)
    }
    sendJSONList(jsonList, function(response) {
        if (response) {
            console.log("전송 성공")
            console.log("결과:", response)
            alert("요청 결과: " + response)
            location.reload();
        } else {
            alert("서버 오류: 박예진한테 카톡 문의 바람")
        }
    })
}

function timeInterval(a, b) {
    var heightA = a[0] * 100 + (a[1] == '00' ? 0 : 50);
    var heightB = b[0] * 100 + (b[1] == '00' ? 0 : 50);
    return Math.abs(heightA - heightB);
}

function addDivToCell(songName, userName, date, startTime, endTime, color) {
    // 요일 전처리
    var currentDate = new Date(date);
    var dayOfWeek = currentDate.getDay() - 1;
    if (dayOfWeek == -1)
        dayOfWeek = 6
    
    // 시작시간
    var start = startTime.split(':')
    var end = endTime.split(':')

    var cellId = 'cell' + Number(start[0]) + '-' + dayOfWeek;
    var cell = document.getElementById(cellId);

    if (cell) {
        var div = document.createElement('div');
        div.className = 'box';
        div.style.height = String(timeInterval(start, end)) + '%'
        //console.log(songName + ":" + end[1])
        //console.log(startTime + "~" + endTime)
        // 시작시간이 n시 30분부터 시작할 때

        if (start[1] == '30') {
            div.style.top = '50%'
        }
        // 종료시간이 n시 30분까지일 때
        

        // 배경색 설정
        div.style.backgroundColor = color

        // 이벤트 추가
        div.onclick = function() {
            showScheduleModal(songName, userName, date, `${startTime}~${endTime}`)
        }

        var p = document.createElement('p');
        p.textContent = songName
        div.appendChild(p)
        cell.appendChild(div);
    };
}

function openReserveModal() {
    var modal = document.getElementById("reserve-form-modal");
    modal.style.display = 'flex';
    document.getElementById("main-timetable").style.marginBottom = "75%";
}

function closeReserveModal() {
    var modal = document.getElementsByClassName("reserve-form-modal")[0];
    modal.classList.add('slide-down');
    modal.addEventListener('animationend', function() {
        modal.style.display = 'none';
        document.getElementById("main-timetable").style.marginBottom = "0%";
        modal.classList.remove('slide-down');
    }, {once: true});
}

function openDetailModal() {
    var modal = document.getElementById("schedule-modal");
    var overlay = document.getElementById('overlay');

    modal.style.display = 'block';
    overlay.style.display = 'block';
}

function closeDetailModal() {
    var modal = document.getElementById("schedule-modal");
    var overlay = document.getElementById('overlay');

    modal.style.display = 'none';
    overlay.style.display = 'none';
}

function showScheduleModal(songName, userName, date, time) {
    // 모달에 표시할 데이터 입력
    document.getElementById('modal-content-song').innerHTML = songName
    document.getElementById('modal-content-user').innerHTML = userName
    document.getElementById('modal-content-date').innerHTML = date
    document.getElementById('modal-content-time').innerHTML = time

    // 모달과 배경을 어둡게하는 오버레이 표시
    openDetailModal('schedule-modal', 'block')
}

function reserveCancel() {
    var reQues = confirm("정말로 예약을 취소하시겠습니까?")
    if (!reQues) {
        return 0;
    }
    var song = document.getElementById('modal-content-song').innerHTML
    var date = document.getElementById('modal-content-date').innerHTML
    var time = document.getElementById('modal-content-time').innerHTML.split("~")
    
    var jsonData = {
        name: song,
        date: date,
        startTime: time[0],
        endTime: time[1]
    };
    var xhr = new XMLHttpRequest();
    xhr.open('DELETE', '/cancel', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                console.log("리스폰: ", xhr.responseText)
                if (xhr.responseText) {
                    alert("취소가 완료되었습니다.")
                    location.reload();
                }
            }
        }
    };
    xhr.send(JSON.stringify(jsonData));
}
function moveWeek(sign, path) {
    var startDay = document.getElementById('day-term-label').innerHTML.split(" ~ ")[0]
    console.log(startDay)
    var date = new Date(startDay);
    // 현재 날짜에서 1을 빼서 이전 날짜로 설정
    date.setDate(date.getDate() + sign);
    // 년, 월, 일 추출
    var year = date.getFullYear();
    var month = ('0' + (date.getMonth() + 1)).slice(-2); // 월은 0부터 시작하므로 +1
    var day = ('0' + date.getDate()).slice(-2);

    // "YYYY-MM-DD" 형식으로 날짜 출력
    var formattedDate = year + '-' + month + '-' + day;

    window.location.assign('/'+path+'?day=' + formattedDate)
}