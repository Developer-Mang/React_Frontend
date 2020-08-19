/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";

import {
  selectSeatSaga,
  setReservedSeat,
} from "../../Reducer/bookingSeatReducer";

import {
  setSeatInfo,
  socialDistance,
  makeRowNameArray,
  makeSeatNumArray,
  searchNearSeat,
} from "../../Utils/bookingSeatUtils";

import "./style/BookingSeatList.scss";

const BookingSeatList = ({ scheduleId, seatType = 0 }) => {
  const seatListRef = useRef();
  const dispatch = useDispatch();

  const [select, personal, reserved] = useSelector((state) => [
    state.Seat.selectedSeat,
    state.Seat.personal,
    state.Seat.reserved,
  ]);

  // 홀 타입
  const hallType = seatType;
  // 행 이름 배열
  const rowNames = makeRowNameArray(setSeatInfo(hallType).row);
  // 좌석 번호 배열
  const seatNums = makeSeatNumArray(setSeatInfo(hallType).maxSeat);
  // 선택 좌석 수
  const totalSeatCount = select.length;
  // 인원 총 원
  const totalCount = Object.values(personal).reduce((p, n) => p + n, 0);
  // 선택 가능
  const selectable = totalCount - totalSeatCount > 0;

  // 좌석 버튼 찾기 함수
  const findBtn = (seatName = "") => {
    const $seatList = seatListRef.current;
    const $seatRow = $seatList.querySelector(
      `li.${`row${seatName.slice(0, 1)}`}`
    );
    return $seatRow.querySelector(`button[value=${seatName}]`);
  };

  // onHover
  const hover = (e) => {
    // 예외처리 (선택 불가 or 선택 가능 인원 2명 미만)
    if (e.target.disabled || totalCount - totalSeatCount < 2) return;
    // 페어 검색 후 페어 좌석이 없을거나 이미 예약된 좌석이면 예외처리
    const pair = searchNearSeat(e.target.value, hallType);
    if (!pair || reserved.includes(pair)) return;

    // 페어 버튼 Element 검색
    const pairBtn = findBtn(pair);
    pairBtn.classList.add("hover");

    // mouseLeave 처리하기
    e.target.addEventListener("mouseleave", () => {
      pairBtn.classList.remove("hover");
    });
  };

  // onClick
  const click = (e) => {
    const selected = [e.target.value];
    // 페어 검색 조건 totalCount가 2 이상일 때
    if (totalCount >= 2) {
      const pair = searchNearSeat(e.target.value, hallType);

      // 이미 예약된 좌석이거나 선택 가능 좌석 수가 2 이상일 때
      if (reserved.includes(pair) || totalCount - totalSeatCount > 1)
        selected.push(pair);
    }

    dispatch(selectSeatSaga(...selected));
  };

  // useEffect re-rendering 방지용 체크
  let checktReservedSeat = "";
  // 예매된 좌석 정보 가져오기
  const callReservedSeatsApi = async () => {
    dispatch(setReservedSeat());
    checktReservedSeat = reserved.join("");
  };

  useEffect(() => {
    if (scheduleId && checktReservedSeat === "") callReservedSeatsApi();
  }, [checktReservedSeat]);

  return (
    <div className="bookingSeatList">
      <ul className="seatRowName">
        {rowNames.map((v) => (
          <li key={`rowName ${v}`} className="textBold">
            {v}
          </li>
        ))}
      </ul>
      <ul className="seatRow" ref={seatListRef}>
        {rowNames.map((row) => (
          <li className={`row${row}`} key={`row ${row}`}>
            {seatNums.map((num) => {
              const booked = reserved.includes(`${row}${num}`);
              const except = setSeatInfo(hallType).except(row, num);
              const selected = select.includes(`${row}${num}`);
              const social = socialDistance(row, num);
              return (
                <button
                  key={`${row}${num}`}
                  value={`${row}${num}`}
                  className={
                    ["btn", "subLight"].join(" ") +
                    (setSeatInfo(hallType).path.includes(num) ? " path" : "") +
                    (selected ? " select" : "") +
                    (except ? " no" : "") +
                    (setSeatInfo(hallType).handicapped.includes(`${row}${num}`)
                      ? " handicapped"
                      : "") +
                    (booked ? " booking" : "") +
                    (social ? " social" : "")
                  }
                  disabled={
                    booked || except || social || !(selectable || selected)
                  }
                  onClick={click}
                  onMouseEnter={hover}
                >
                  {num}
                </button>
              );
            })}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default React.memo(BookingSeatList);
