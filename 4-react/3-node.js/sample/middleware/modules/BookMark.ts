import bookMarkReducer, {
  addBookMark,
  addTotalpages,
  initialCompleted,
  initialNextBookMark,
  initialPagedBookMark,
  initialBookMark,
  initialBookMarkItem,
  modifyBookMark,
  BookMarkPage,
  removeBookMark,
} from "../../provider/modules/BookMark";
import { createAction, nanoid, PayloadAction } from "@reduxjs/toolkit";
import { BookMarkItem } from "../../provider/modules/BookMark";
import {
  call,
  put,
  select,
  takeEvery,
  takeLatest,
} from "@redux-saga/core/effects";
import api, {
  BookMarkItemRequest,
  BookMarkItemResponse,
  BookMarkPagingReponse,
} from "../../api/BookMark";
import { AxiosResponse } from "axios";
import { addAlert } from "../../provider/modules/alert";
import { RootState } from "../../provider";
import { dataUrlToFile } from "../../lib/string";
import fileApi from "../../api/file";

/* ========= saga action Payload 타입 =============== */
export interface PageRequest {
  page: number;
  size: number;
}

/* ========= saga action을 생성하는 부분 =============== */

// bookMark를 추가하도록 요청하는 action
// {type:string, payload:bookMarkItem}
// {type:"bookMark/requestAddbookMark", payload: {title, bookMarkUrl...}}

// bookMark를 추가하도록 요청하는 action creator를 생성
// const actionCreator = createAction<Payload타입>(Action.type문자열)
// 전체 데이터 조횡에서 추가할 때
export const requestAddBookMark = createAction<BookMarkItem>(
  `${bookMarkReducer.name}/requestAddBookMark`
);

// 숫자 페이징에서 추가할 때
export const requestAddBookMarkPaging = createAction<BookMarkItem>(
  `${bookMarkReducer.name}/requestAddBookMarkPaging`
);

// 더보기 페이징에서 추가할 때
export const requestAddBookMarkNext = createAction<BookMarkItem>(
  `${bookMarkReducer.name}/requestAddBookMarkNext`
);

// BookMark를 가져오는 action
export const requestFetchBookMarks = createAction(
  `${bookMarkReducer.name}/requestFetchBookMarks`
);

// BookMark를 페이징으로 가져오는 action
export const requestFetchPagingBookMarks = createAction<PageRequest>(
  `${bookMarkReducer.name}/requestFetchPagingBookMarks`
);

// 다음 페이지 BookMark를 가져오는 action
export const requestFetchNextBookMarks = createAction<PageRequest>(
  `${bookMarkReducer.name}/requestFetchNextBookMarks`
);

// 1건의 BookMark만 가져오는 action
export const requestFetchBookMarkItem = createAction<number>(
  `${bookMarkReducer.name}/requestFetchBookMarkItem`
);

// BookMark를 삭제하는 action
export const requestRemoveBookMark = createAction<number>(
  `${bookMarkReducer.name}/requestRemoveBookMark`
);

// BookMark를 삭제하는 action(숫자페이징일때)
export const requestRemoveBookMarkPaging = createAction<number>(
  `${bookMarkReducer.name}/requestRemoveBookMarkPaging`
);

// BookMark를 삭제하는 action(더보기페이징일때)
export const requestRemoveBookMarkNext = createAction<number>(
  `${bookMarkReducer.name}/requestRemoveBookMarkNext`
);

// BookMark를 수정하는 action
export const requestModifyBookMark = createAction<BookMarkItem>(
  `${bookMarkReducer.name}/requestModifyBookMark`
);

/* ========= saga action을 처리하는 부분 =============== */

// 서버에 POST로 데이터를 보내 추가하고, redux state를 변경
function* addDataPaging(action: PayloadAction<BookMarkItem>) {
  yield console.log("--addDataPaging--");
  yield console.log(action);

  try {
    // action의 payload로 넘어온 객체
    const bookMarkItemPayload = action.payload;

    // spinner 보여주기

    /* --- (추가로직) 2021-11-01 s3 업로드 처리 --- */
    // 1. dataUrl -> file 변환

    // 2. form data 객체 생성

    // 3. multipart/form-data로 업로드
    /*-------------------------------------------------------- */

    // rest api로 보낼 요청객체
    const bookMarkItemRequest: BookMarkItemRequest = {
      title: bookMarkItemPayload.title,
      // title: "", // 임시로 에러 유발(400)
      description: bookMarkItemPayload.description,
      // bookMarkUrl: bookMarkItemPayload.bookMarkUrl, // base64 dataURL
      fileType: bookMarkItemPayload.fileType,
      fileName: bookMarkItemPayload.fileName,
    };

    // ------ 1. rest api에 post로 데이터 보냄
    // call(함수, 매개변수1, 매개변수2...) -> 함수를 호출함
    // 함수가 Promise를 반환하면, (비동기함수)
    // Saga 미들웨어에서 현재 yield에 대기상태로 있음
    // Promise가 resolve(처리완료)되면 다음 yield로 처리가 진행됨
    // reject(거부/에러)되면 예외를 던짐(throw) -> try ... catch문으로 받을 수 있음.

    // await api.add(bookMarkItemRequest) 이 구문과 일치함
    // 결과값을 형식을 지졍해야함
    const result: AxiosResponse<BookMarkItemResponse> = yield call(
      api.add,
      bookMarkItemRequest
    );


    // ------ 2. redux state를 변경함
    // **2021-09-28- 페이징 처리 추가 로직
    // 추가하기전에 현재 페이지의 가장 마지막 데이터를 삭제
    // redux state 조회하기
    const bookMarkData: BookMarkItem[] = yield select(
      (state: RootState) => state.bookMark.data
    );

    const bookMarkPageSize: number = yield select(
      (state: RootState) => state.bookMark.pageSize
    );
    // 현재 redux state에 데이터가 있으며, 페이지크기와 데이터 크기가 같으면
    if (bookMarkData.length > 0 && bookMarkData.length == bookMarkPageSize) {
      // redux state의 가장 마지막 요소 삭제
      const deleteId = bookMarkData[bookMarkData.length - 1].id;
      yield put(removeBookMark(deleteId));
      // 전체 페이지 수를 증가
      yield put(addTotalpages);
    }

    // 백엔드에서 처리한 데이터 객체로 state를 변경할 payload 객체를 생성
    const bookMarkItem: BookMarkItem = {
      id: result.data.id,
      title: result.data.title,
      description: result.data.description,
      fileType: result.data.fileType,
      fileName: result.data.fileName,
      createdTime: result.data.createdTime,
    };

    // dispatcher(액션)과 동일함
    // useDispatch로 dispatcher 만든 것은 컴포넌트에서만 가능
    // put이펙트를 사용함
    yield put(addBookMark(bookMarkItem));

    // completed 속성 삭제
    yield put(initialCompleted());

    // alert박스를 추가해줌
    yield put(
      addAlert({ id: nanoid(), variant: "success", message: "저장되었습니다." })
    );
  } catch (e: any) {
    // 에러발생
    // spinner 사라지게 하기
    // alert박스를 추가해줌
    yield put(
      addAlert({ id: nanoid(), variant: "danger", message: e.message })
    );
  }
}

function* addDataNext(action: PayloadAction<BookMarkItem>) {
  yield console.log("--addDataNext--");
  yield console.log(action);

  try {
    // action의 payload로 넘어온 객체
    const bookMarkItemPayload = action.payload;


    /* --- (추가로직) 2021-11-01 s3 업로드 처리 --- */
    // 1. dataUrl -> file 변환

    // 2. form data 객체 생성
    const formFile = new FormData();

    // 3. multipart/form-data로 업로드
    const fileUrl: AxiosResponse<string> = yield call(fileApi.upload, formFile);
    /*-------------------------------------------------------- */

    // rest api로 보낼 요청객체
    const bookMarkItemRequest: BookMarkItemRequest = {
      title: bookMarkItemPayload.title,
      // title: "", // 임시로 에러 유발(400)
      description: bookMarkItemPayload.description,
      // bookMarkUrl: bookMarkItemPayload.bookMarkUrl,
      fileType: bookMarkItemPayload.fileType,
      fileName: bookMarkItemPayload.fileName,
    };

    // ------ 1. rest api에 post로 데이터 보냄
    // call(함수, 매개변수1, 매개변수2...) -> 함수를 호출함

    // 함수가 Promise를 반환하면, (비동기함수)
    // Saga 미들웨어에서 현재 yield에 대기상태로 있음
    // Promise가 resolve(처리완료)되면 다음 yield로 처리가 진행됨
    // reject(거부/에러)되면 예외를 던짐(throw) -> try ... catch문으로 받을 수 있음.

    // await api.add(bookMarkItemRequest) 이 구문과 일치함
    // 결과값을 형식을 지졍해야함
    const result: AxiosResponse<BookMarkItemResponse> = yield call(
      api.add,
      bookMarkItemRequest
    );

    // spinner 사라지게 하기

    // ------ 2. redux state를 변경함
    // 백엔드에서 처리한 데이터 객체로 state를 변경할 payload 객체를 생성
    const bookMarkItem: BookMarkItem = {
      id: result.data.id,
      title: result.data.title,
      description: result.data.description,
      fileType: result.data.fileType,
      fileName: result.data.fileName,
      createdTime: result.data.createdTime,
    };

    // dispatcher(액션)과 동일함
    // useDispatch로 dispatcher 만든 것은 컴포넌트에서만 가능
    // put이펙트를 사용함
    yield put(addBookMark(bookMarkItem));

    // completed 속성 삭제
    yield put(initialCompleted());

    // alert박스를 추가해줌
    yield put(
      addAlert({ id: nanoid(), variant: "success", message: "저장되었습니다." })
    );
  } catch (e: any) {
    // 에러발생
    // alert박스를 추가해줌
    yield put(
      addAlert({ id: nanoid(), variant: "danger", message: e.message })
    );
  }
}

// Redux 사이드 이펙트
// 1. api 연동
// 2. 파일처리
// 3. 처리중 메시지 보여주기/감추기
// 4. 에러메시지 띄우기
// 서버에서 GET으로 데이터를 가저오고, redux state를 초기화
function* fetchData() {
  yield console.log("--fetchData--");

  // 백엔드에서 데이터 받아오기
  const result: AxiosResponse<BookMarkItemResponse[]> = yield call(api.fetch);


  // 응답데이터배열을 액션페이로드배열로 변환
  // BookMarkItemReponse[] => BookMarkItem[]
  const bookMarks = result.data.map(
    (item) =>
    ({
      id: item.id,
      title: item.title,
      description: item.description,
      fileType: item.fileType,
      fileName: item.fileName,
      createdTime: item.createdTime,
    } as BookMarkItem)
  );

  // state 초기화 reducer 실행
  yield put(initialBookMark(bookMarks));
}

// 숫자 페이징 목록 조회
function* fetchPagingData(action: PayloadAction<PageRequest>) {
  yield console.log("--fetchPagingData--");

  const page = action.payload.page;
  const size = action.payload.size;

  localStorage.setItem("bookMark_page_size", size.toString());


  try {
    // 백엔드에서 데이터 받아오기
    const result: AxiosResponse<BookMarkPagingReponse> = yield call(
      api.fetchPaging,
      page,
      size
    );



    // 받아온 페이지 데이터를 Payload 변수로 변환
    const bookMarkPage: BookMarkPage = {
      // 응답데이터배열을 액션페이로드배열로 변환
      // BookMarkItemReponse[] => BookMarkItem[]
      data: result.data.content.map(
        (item) =>
        ({
          id: item.id,
          title: item.title,
          description: item.description,
          fileType: item.fileType,
          fileName: item.fileName,
          createdTime: item.createdTime,
        } as BookMarkItem)
      ),
      totalElements: result.data.totalElements,
      totalPages: result.data.totalPages,
      page: result.data.number,
      pageSize: result.data.size,
      isLast: result.data.last,
    };

    // state 초기화 reducer 실행
    yield put(initialPagedBookMark(bookMarkPage));
  } catch (e: any) {
    // 에러발생
    // alert박스를 추가해줌
    yield put(
      addAlert({ id: nanoid(), variant: "danger", message: e.message })
    );
  }
}

// 더보기 목록 조회
function* fetchNextData(action: PayloadAction<PageRequest>) {
  yield console.log("--fetchNextData--");

  const page = action.payload.page;
  const size = action.payload.size;

  try {
    // 백엔드에서 데이터 받아오기
    const result: AxiosResponse<BookMarkPagingReponse> = yield call(
      api.fetchPaging,
      page,
      size
    );



    // 받아온 페이지 데이터를 Payload 변수로 변환
    const bookMarkPage: BookMarkPage = {
      // 응답데이터배열을 액션페이로드배열로 변환
      // BookMarkItemReponse[] => BookMarkItem[]
      data: result.data.content.map(
        (item) =>
        ({
          id: item.id,
          title: item.title,
          description: item.description,
          fileType: item.fileType,
          fileName: item.fileName,
          createdTime: item.createdTime,
        } as BookMarkItem)
      ),
      totalElements: result.data.totalElements,
      totalPages: result.data.totalPages,
      page: result.data.number,
      pageSize: result.data.size,
      isLast: result.data.last,
    };

    // state 초기화 reducer 실행
    yield put(initialNextBookMark(bookMarkPage));
  } catch (e: any) {
    // 에러발생

    // alert박스를 추가해줌
    yield put(
      addAlert({ id: nanoid(), variant: "danger", message: e.message })
    );
  }
}
// 1건의 데이터만 조회
function* fetchDataItem(action: PayloadAction<number>) {
  yield console.log("--fetchDataItem--");

  const id = action.payload;

  // 백엔드에서 데이터 받아오기
  const result: AxiosResponse<BookMarkItemResponse> = yield call(api.get, id);

  const bookMark = result.data;
  if (bookMark) {
    // state 초기화 reducer 실행
    yield put(initialBookMarkItem(bookMark));
  }
}

// 삭제처리
function* removeDataPaging(action: PayloadAction<number>) {
  yield console.log("--removeData--");

  // id값
  const id = action.payload;
  console.log(id);



  /* --- (추가로직) 2021-11-01 S3 파일 삭제 로직 추가 --- */
  // redux state에서 id로
  // object key 가져오기 예) https://배포Id.cloudfront.net/objectKey
  const bookMarkItem: BookMarkItem = yield select((state: RootState) =>
    state.bookMark.data.find((item) => item.id === id)
  );

  // file api 호출해서 s3에 파일 삭제
  /* ------------------------------------------------- */

  // rest api 연동
  const result: AxiosResponse<boolean> = yield call(api.remove, id);



  // 반환 값이 true이면
  if (result.data) {
    // state 변경(1건삭제)
    yield put(removeBookMark(id));
  } else {
    // alert박스를 추가해줌
    yield put(
      addAlert({
        id: nanoid(),
        variant: "danger",
        message: "오류로 저장되지 않았습니다.",
      })
    );
  }

  // completed 속성 삭제
  yield put(initialCompleted());

  // 현재 페이지 데이터를 다시 가져옴
  // 현재 페이지와 사이즈 값을 읽어옴
  const page: number = yield select((state: RootState) => state.bookMark.page);
  const size: number = yield select((state: RootState) => state.bookMark.pageSize);

  yield put(requestFetchPagingBookMarks({ page, size }));
}

function* removeDataNext(action: PayloadAction<number>) {
  yield console.log("--removeDataNext--");

  // id값
  const id = action.payload;
  yield console.log(id);



  /* --- (추가로직) 2021-11-01 S3 파일 삭제 로직 추가 --- */
  // redux state에서 id로
  // object key 가져오기 예) https://배포Id.cloudfront.net/objectKey
  const bookMarkItem: BookMarkItem = yield select((state: RootState) =>
    state.bookMark.data.find((item) => item.id === id)
  );

  /* ------------------------------------------------- */

  // rest api 연동
  const result: AxiosResponse<boolean> = yield call(api.remove, id);



  // 반환 값이 true이면
  if (result.data) {
    // state 변경(1건삭제)
    yield put(removeBookMark(id));
  } else {
    // alert박스를 추가해줌
    yield put(
      addAlert({
        id: nanoid(),
        variant: "danger",
        message: "오류로 저장되지 않았습니다.",
      })
    );
  }

  // completed 속성 삭제
  yield put(initialCompleted());
}

// 수정처리
function* modifyData(action: PayloadAction<BookMarkItem>) {
  yield console.log("--modifyData--");

  // action의 payload로 넘어온 객체
  const bookMarkItemPayload = action.payload;



  // 파일이 바뀌었으면 base64파일

  // rest api로 보낼 요청객체
  const bookMarkItemRequest: BookMarkItemRequest = {
    title: bookMarkItemPayload.title,
    description: bookMarkItemPayload.description,
    fileType: bookMarkItemPayload.fileType,
    fileName: bookMarkItemPayload.fileName,
  };

  const result: AxiosResponse<BookMarkItemResponse> = yield call(
    api.modify,
    bookMarkItemPayload.id,
    bookMarkItemRequest
  );



  // 백엔드에서 처리한 데이터 객체로 state를 변경할 payload 객체를 생성
  const bookMarkItem: BookMarkItem = {
    id: result.data.id,
    title: result.data.title,
    description: result.data.description,
    fileType: result.data.fileType,
    fileName: result.data.fileName,
    createdTime: result.data.createdTime,
  };

  // state 변경
  yield put(modifyBookMark(bookMarkItem));

  // completed 속성 삭제
  yield put(initialCompleted());
}

/* ========= saga action을 감지(take)하는 부분 =============== */
// bookMark redux state 처리와 관련된 saga action들을 감지(take)할 saga를 생성
// saga는 generator 함수로 작성
export default function* bookMarkSaga() {
  // takeEvery(처리할액션, 액션을처리할함수)
  // 동일한 타입의 액션은 모두 처리함
  yield takeEvery(requestAddBookMark, addDataNext);
  yield takeEvery(requestAddBookMarkPaging, addDataPaging);
  yield takeEvery(requestAddBookMarkNext, addDataNext);

  // takeLatest(처리할액션, 액션을처리할함수)
  // 동일한 타입의 액션중에서 가장 마지막 액션만 처리, 이전 액션은 취소

  // 1건의 데이터만 조회
  yield takeEvery(requestFetchBookMarkItem, fetchDataItem);
  yield takeLatest(requestFetchBookMarks, fetchData);
  yield takeLatest(requestFetchPagingBookMarks, fetchPagingData);
  yield takeLatest(requestFetchNextBookMarks, fetchNextData);

  // 삭제처리
  yield takeEvery(requestRemoveBookMark, removeDataNext);
  yield takeEvery(requestRemoveBookMarkPaging, removeDataPaging);
  yield takeEvery(requestRemoveBookMarkNext, removeDataNext);

  // 수정처리
  yield takeEvery(requestModifyBookMark, modifyData);
}
