import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ReactPlayer from 'react-player';
import './Home.css';
import Axios from 'axios';
import $, { post } from 'jquery';
import { v4 as uuidv4 } from 'uuid';
import { Loader } from "@googlemaps/js-api-loader"
import MarkerClusterer from "@googlemaps/markerclustererplus"; // MarkerClusterer 라이브러리 임포트

function Home(props) {
  // 가로넓이 반영
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // 포스트 관련
  const [News, SetNews] = useState([]);
  const [Event, SetEvent] = useState([]);
  const [Comment, SetComment] = useState([]);  // Comment 데이터 관련
  const [Posts, SetPosts] = useState([]);   // posts 데이터 관련

  // 구글 지도 관련
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const googleapiKey = process.env.REACT_APP_GOOGLE_API_KEY;

  const [CurrentLat, SetCurrentLat] = useState(37.5546788);
  const [CurrentLng, SetCurrentLng] = useState(126.9706069);
  const CurrentLoc = useRef(null);

  let markers=[];
  let postAllmarker = [];
  const [mapCircleArr, SetmapCircleArr] = useState([]);
  const [map, Setmap] = useState(null);
  const [maploading, Setmaploading] = useState(false);
  const mapRef = useRef(null);
  const BackMainRef = useRef(null);
  const KeywordRef = useRef(null);
  const SearchRef = useRef(null);

  const [Keyword, SetKeyword] = useState("");  // 검색키워드, 매개변수와도 연관

  const [SearchLocation, SetSearchLocation] = useState([]);

  const [check1stLoad, Setcheck1stLoad] = useState(false);
  
  // 로딩키를 겸함... props.. url 쿼리 반영예정
  const [PostsPage, SetPostsPage] = useState("");

  // 로드된 데이터들...
  const [ShowPosts, SetShowPosts] = useState([]);
  const [ShowComments, SetShowComments] = useState([]);

  // 입력한 댓글...
  const [CommentInput, SetCommentInput] = useState("");
  const [CommentPW, SetCommentPW] = useState("");

  // 코멘트, 포스트 삭제를 위한 pw
  const [delPW, SetdelPW] = useState("");

  // 글쓴이 식별자
  const [WroteCode, SetWroteCode] = useState(props.WroteCode);
  const [ID, SetID] = useState(props.ID);

  // 신고 관련 변수들
  const [AlertType, SetAlertType] = useState("");
  const [AlertDetail, SetAlertDetail] = useState("");  
  const [AlertPW, SetAlertPW] = useState("");

  // 포스트 필터링
  const [PostsSearch, SetPostsSearch] = useState([]);   // posts 검색데이터 관련
  const [filterordering, SetFilterordering] = useState('최근 업로드');  // 정렬
  const [filterType, SetFilterType] = useState('전체');  // 종류
  const [filterRadius, SetFilterRadius] = useState(5);  // 거리
  const paging = 30;  // 출력 페이지 수
  const [pagecount, Setpagecount] = useState(0);  // 페이지 출력 횟수
  const [showMore, SetshowMore] = useState(false);

  // 링킹 처리 관련
  const location = useLocation();
  const [thePostsNum, SetthePostsNum] = useState("");
  const [theLat, SettheLat] = useState("");
  const [theLng, SettheLng] = useState("");
  const [theZoom, SettheZoom] = useState("");
  const [theIndex, SettheIndex] = useState("");

  useEffect(() => {   
    MainOnSearchOff();
    SearchPostHide();  
    LoadingCurrentLocation();
    closeDeleteCommentAll();
    closeDeletePostsAll();

    const handleResize = () => {  // 가로길이 처리
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  function LoadingCurrentLocation(){
    if (navigator.geolocation) {   // 현 위치 반영하기
      navigator.geolocation.getCurrentPosition(
        (position) => {
          SetCurrentLat(position.coords.latitude);
          SetCurrentLng(position.coords.longitude);
        },
        (error) => {
          console.error('위치 정보를 가져오는 중 오류가 발생했습니다:', error);
        }
      );
    }
  }
 
  useEffect(() => {
    if(check1stLoad){
      SetWroteCode(props.WroteCode);
      SetID(props.ID);     
    } else {
      Setcheck1stLoad(true);
    }
  }, [check1stLoad]);

 

  // rest api 매개변수처리
  useEffect(()=>{
    if(thePostsNum===""){
      const searchParams = new URLSearchParams(location.search);

      // 다른매개변수들도 설정
      SettheLat(searchParams.get('searchLat'));
      SettheLng(searchParams.get('searchLng'));
      SettheZoom(searchParams.get('searchZoom'));
      SettheIndex(searchParams.get('searchIndex'));

      SetKeyword(searchParams.get('Keyword'));

      if(searchParams.get('SearchOrder')!==null){  SetFilterordering(searchParams.get('SearchOrder')); }
      if(searchParams.get('SearchType')!==null){ SetFilterType(searchParams.get('SearchType')); }
      if(searchParams.get('SearchMile')!==null){ SetFilterRadius(parseInt(searchParams.get('SearchMile'))); }
      
      SetthePostsNum(searchParams.get('thenum'));
    }
  },[thePostsNum]);
  
  useEffect(() => {
    if (!googleMapsLoaded) {
      const loader = new Loader({
        apiKey: googleapiKey,
        version: "weekly",
        libraries: ["places"]
      });
      
      loader.load().then(async () => {
        const { Map } = await window.google.maps.importLibrary("maps");

        Setmap(new Map(mapRef.current, {
          center: { lat: CurrentLat, lng: CurrentLng },
          zoom: 7,
          minZoom: 3,
          restriction: {
            latLngBounds: {
              north: 85,
              south: -85,
            },
          },
        }));
         
        setGoogleMapsLoaded(true);
        Setmaploading(true);       
      });
    }
  }, [googleMapsLoaded]);
  
  useEffect(() => {
    if (maploading) {
      // 구글지도 이벤트 리스너 등록
      map.addListener('click', (event) => {
        QuitPostsPage();
        markers.forEach((marker) => marker.setMap(null));
        markers = [];
        addMarker(event.latLng, map, markers);

        MainOffSearchOn();
      });

      CurrentLoc.current.addEventListener('click', (event) => {
        if (navigator.geolocation) {   // 현 위치 반영하기
          navigator.geolocation.getCurrentPosition(
            (position) => {
              SetCurrentLat(position.coords.latitude);
              SetCurrentLng(position.coords.longitude);
            },
            (error) => {
              console.error('위치 정보를 가져오는 중 오류가 발생했습니다:', error);
            }
          );
        }

        const location ={ lat : CurrentLat, lng : CurrentLng };
        
        QuitPostsPage();
        markers.forEach((marker) => marker.setMap(null));
        markers = [];
        addMarkerCurrent(location, map, markers);
        MainOffSearchOn();
       
      });
  
      KeywordRef.current.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          markers.forEach((marker) => marker.setMap(null));
          markers = [];
          fetchAddresses(e.target.value, map, markers);
          MainOffSearchOn(); 
          if(e.target.value!=="" && e.target.value!==null && e.target.value!==undefined){
            window.history.pushState(null, '', `${window.location.origin}?Keyword=${e.target.value}&searchLat=${ map.center.lat()}&searchLng=${ map.center.lng()}&searchZoom=${map.zoom}`);
          }
        }
      });
  
      SearchRef.current.addEventListener('click', (e) => {
        markers.forEach((marker) => marker.setMap(null));
        markers = [];
        fetchAddresses(e.target.value, map, markers);
        MainOffSearchOn();  
        if(e.target.value!=="" && e.target.value!==null && e.target.value!==undefined){
          window.history.pushState(null, '', `${window.location.origin}?Keyword=${e.target.value}&searchLat=${ map.center.lat()}&searchLng=${ map.center.lng()}&searchZoom=${map.zoom}`);
        }
      });
  
      BackMainRef.current.addEventListener('click', () => {
        SetSearchLocation([]);
        markers.forEach((marker) => marker.setMap(null));
        markers = [];
        MainOnSearchOff();
        window.history.pushState(null, '', `${window.location.origin}`);
      });

      if(thePostsNum ==="" || thePostsNum === NaN || thePostsNum===undefined || thePostsNum===null ){
        if(theIndex ==="" || theIndex === NaN || theIndex===undefined || theIndex===null){ 
          if(Keyword!=="" && Keyword!==null){
            markers.forEach((marker) => marker.setMap(null));
            markers = [];
            fetchAddresses(Keyword, map, markers);
            MainOffSearchOn(); 
          }
        }
        else{ 
          const parsetheIndex = parseInt(theIndex);
          if(parsetheIndex===0){  // Search 결과가 하나 있을 때.
            const location ={ lat : parseFloat(theLat), lng : parseFloat(theLng) };
            QuitPostsPage();
            markers.forEach((marker) => marker.setMap(null));
            markers = [];
            addMarkerCurrent(location, map, markers);
            MainOffSearchOn();
          } 
        }
      } else{ LoadPostsPage(parseInt(thePostsNum)); }
      
    }
  }, [maploading]);
  
  useEffect(()=>{  // 총량 처리할 것. 마이페이지도 마찬가지
    if(SearchLocation.length === 1){  // 검색결과가 하나만 남을 경우 
      const lat = SearchLocation[0].lat;  // 위도
      const lng = SearchLocation[0].lng;  // 경도
      const radius = filterRadius;  // 반경 (mile)
      const orderby = filterordering;  // 정렬
      const type = filterType;   // 필터링
      const pagecount = 0;  // 딜레이 때문에 대체
      
      mapCircleArr.forEach((circle) => circle.setMap(null));  // 이전에 생성된 원 객체들을 제거
      SetmapCircleArr([]);
    
      let mapCircles=[];

      let circlePosition = { lat : parseFloat(lat), lng : parseFloat(lng) };
      const mapCircle = {
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 0,
        fillColor: '#ff9100',
        fillOpacity: 0.35,
        map: map,
        center: circlePosition,
        radius: radius * 1000 * 1.60934, // km to meters
        zIndex: 0,
        clickable: false,
      };
      let newCircle = new window.google.maps.Circle(mapCircle); // 새로운 원 객체 생성
      mapCircles.push(newCircle); // 생성된 원 객체를 배열에 추가
      SetmapCircleArr(mapCircles);

      SetPostsSearch([]);
      Setpagecount(0);
      SetshowMore(false);

      window.history.pushState(null, '', `${window.location.origin}?Keyword=${Keyword}&searchLat=${ map.center.lat()}&searchLng=${ map.center.lng()}&searchZoom=${map.zoom}&searchIndex=${0}&SearchOrder=${filterordering}&SearchType=${filterType}&SearchMile=${filterRadius}`);
    }
    else{ // 데이터 불러오기 금지
      mapCircleArr.forEach((circle) => circle.setMap(null));
      SetmapCircleArr([]);
      SearchPostHide();
    } 
  },[SearchLocation, filterordering, filterType, filterRadius]);

  async function showMorePosts(){
    if(SearchLocation.length === 1 && showMore){  // 검색결과가 하나만 남을 경우 showMore로 방지하기
      const lat = SearchLocation[0].lat;  // 위도
      const lng = SearchLocation[0].lng;  // 경도
      const radius = filterRadius;  // 반경 (mile)
      const orderby = filterordering;  // 정렬
      const type = filterType;   // 필터링
    }
  } 

  async function fetchAddresses(query, map, markersFetch) {
    const placesService = new window.google.maps.places.PlacesService(map);
    let center, thezoom;
    if(theLat==="" || theLat===undefined || theLat===null || theLat===NaN){
      center ={ lat : map.center.lat(), lng : map.center.lng() };
      thezoom = map.zoom;
    } else {
      center ={ lat : parseFloat(theLat), lng : parseFloat(theLng) };
      thezoom = parseFloat(theZoom);
    }
    const request = {
      query: query,
      location: center, // 검색 기준 위치
    };

    placesService.textSearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        // 결과 처리
        let searchloc=[];
        results.forEach((place, index) => {
          // 각 장소에 대한 처리
          const marker = new window.google.maps.Marker({
            position: place.geometry.location,
            map: map,
            title: place.name, // place 객체에는 name 속성이 있습니다.
            icon : 'img/markers/point.png'
          });
          markersFetch.push(marker); // 새로운 마커를 배열에 추가

          searchloc.push({
            name : place.name,
            lat : place.geometry.location.lat(),
            lng : place.geometry.location.lng(),
            addr : place.formatted_address,
            marker : marker
          });
        
          // 클릭 이벤트 리스너 추가
          marker.addListener('click', () => {
            handleMarkerClickR(marker, markersFetch, index, searchloc);
          });

          // 1번째 마커의 위치로 지도 이동
          if (index === 0) {
            map.setCenter(place.geometry.location);
            map.setZoom(thezoom);
          }
        });
        SetSearchLocation(searchloc);
      } else {
        console.error('주변 검색 실패:', status);
      }
    });
  }

  function handleMarkerClickR(clickedMarker, markers, index, searchloc) {   // searchloc은 자기포함 이전거 기록만 가짐.
    // 클릭된 마커를 다른 마커로 바꿈
    clickedMarker.setIcon('img/markers/radar.png');

    // 나머지 마커들을 지움
    markers.forEach(marker => {
      if (marker !== clickedMarker) {
          marker.setMap(null); // 지도에서 마커 제거
      }
    });

    SetSearchLocation([searchloc[index]]);
  }

  function handleMarkerClickL(index) {   // searchloc은 자기포함 이전거 기록만 가짐.    
    if(SearchLocation.length>1){
      SearchLocation[index].marker.setIcon('img/markers/radar.png');
      // 나머지 마커들을 지움
      SearchLocation.forEach((sloc, indexs) => {
        if (indexs !== index) {
            sloc.marker.setMap(null); // 지도에서 마커 제거
        }
      });

      SetSearchLocation([SearchLocation[index]]);
    }
  }

  function addMarker(location, map, markers) {
    const google = window.google;
    const marker = new google.maps.Marker({
      position: location,
      map: map,
      icon : 'img/markers/radar.png',
      zIndex : 1,
    });
    markers.push(marker); // 새로운 마커를 배열에 추가
    map.setCenter(marker.getPosition()); // 마커 위치를 지도 중심으로 설정
    
    // 주소, 경도, 위도 출력
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'location': location }, (results, status) => {
      if (status === 'OK') {
        if (results[0]) {          
          let searchloc = {
            name : results[0].name,
            lat : location.lat(),
            lng : location.lng(),
            addr : results[0].formatted_address
          }
          SetSearchLocation([searchloc]);
        } else {
          console.error('지오코딩 결과를 찾을 수 없습니다.');
        }
      } else {
        console.error('지오코딩 실패:', status);
      }
    });
  }

  function addMarkerCurrent(location, map, markers) {
    let thezoom;
    if(theZoom==="" || theZoom===undefined || theZoom===null || theZoom===NaN){
      thezoom = map.zoom;
    } else {
      thezoom = parseFloat(theZoom);
    }

    const google = window.google;
    const marker = new google.maps.Marker({
      position: location,
      map: map,
      icon : 'img/markers/radar.png',
      zIndex : 1,
    });
    markers.push(marker); // 새로운 마커를 배열에 추가
    map.setCenter(marker.getPosition()); // 마커 위치를 지도 중심으로 설정
    map.setZoom(thezoom);
    
    // 주소, 경도, 위도 출력
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'location': location }, (results, status) => {
      if (status === 'OK') {
        if (results[0]) {          
          let searchloc = {
            name : results[0].name,
            lat : location.lat,
            lng : location.lng,
            addr : results[0].formatted_address
          }
          SetSearchLocation([searchloc]);
        } else {
          console.error('지오코딩 결과를 찾을 수 없습니다.');
        }
      } else {
        console.error('지오코딩 실패:', status);
      }
    });
  }

  // ui js
  const TabChoose = (value) => {
    $('.Home .RecentPart .RecentTab > div').removeClass('active');
    $('.Home .RecentPart .RecentPosts').removeClass('active');
    $('.Home .RecentPart .RecentRequest').removeClass('active');

    if (value === "post") {
      $('.Home .RecentPart .RecentTab > div').eq(0).addClass('active');
      $('.Home .RecentPart .RecentPosts').addClass('active');
    }

    if (value === "request") {
      $('.Home .RecentPart .RecentTab > div').eq(1).addClass('active');
      $('.Home .RecentPart .RecentRequest').addClass('active');
    }
  };

  function MainOnSearchOff(){
    $('.Home .MainPart').show();
    $('.Home .SearchPart').hide();
    $('.Home .LeftSide .SearchNode .Search .fa-magnifying-glass').show();
    $('.Home .LeftSide .SearchNode .Search .fa-x').hide();
    SetKeyword(""); // 빈 문자열을 할당하여 값들을 지웁니다.
  }

  function MainOffSearchOn(){
    $('.Home .MainPart').hide();
    $('.Home .SearchPart').show();
    $('.Home .LeftSide .SearchNode .Search .fa-magnifying-glass').hide();
    $('.Home .LeftSide .SearchNode .Search .fa-x').show();
  }

  function SearchPostHide(){
    $('.Home .SearchPart .SearchPosts').hide();
  }

  function SearchPostShow(){
    $('.Home .SearchPart .SearchPosts').show();
  }

  function PostLinkCopy(e, text){
    navigator.clipboard.writeText(text);
    alert("url 복사 완료");
  }

  // pass page functions
  function LoadPostsPage(no){
    SetPostsPage(no);
  }

  function QuitPostsPage(e){
    SetShowPosts([]);  
    SetShowComments([]);
    SetPostsPage("");
    if(SearchLocation.length===1){
      window.history.pushState(null, '', `${window.location.origin}?Keyword=${Keyword}&searchLat=${ map.center.lat()}&searchLng=${ map.center.lng()}&searchZoom=${map.zoom}&searchIndex=${0}&SearchOrder=${filterordering}&SearchType=${filterType}&SearchMile=${filterRadius}`); // History API를 사용하여 URL 변경
    } else {
      window.history.pushState(null, '', `${window.location.origin}`); // History API를 사용하여 URL 변경
    }
  }

  async function checkBlock(){
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1 해주고, 두 자리로 만들기 위해 padStart 사용
    const day = String(currentDate.getDate()).padStart(2, '0'); // 일자도 두 자리로 만들기 위해 padStart 사용
    const formattedDate = `${year}-${month}-${day}`;

    let IP="", IPUserCheck=true, IPUserBlock=[];
    await Axios.get('https://api.ip.pe.kr/json/')  // ip를 로드한다.
    .then(response => { IP=response.data.ip; })
    .catch(error => {
      alert("네트워크에 문제가 발생했습니다. 인터넷을 확인해주세요.");
      return;
    });

    return [IP, IPUserCheck, IPUserBlock];
  }
  

  function closeDeletePostsAll(){
    $('.Home .LeftSide .PostsContext .CommentSide .CommentDel').hide();
  }

  async function UploadAlert(e, no, delPW, wrote){
    const type = AlertType;
    if(type===""){ alert("신고 종류를 선택해주세요."); } 
    else {
      const code = uuidv4();   // code 값을 구한다.
      
      const detail = convertToHTML(AlertDetail);
      const link = window.location.origin + '/?thenum=' + no;
      const currentDate = new Date();
      const uploadDate = currentDate.toISOString().slice(0, 19).replace('T', ' ');
      let IpId, Ipshot, pwnone = delPW;
      await Axios.get('https://api.ip.pe.kr/json/')  // ip를 로드한다.
      .then(response => { IpId=response.data.ip; })
      .catch(error => {
        alert("네트워크에 문제가 발생했습니다. 인터넷을 확인해주세요.");
        return;
      });

      if(wrote){
        Ipshot = ID;
        pwnone = "";
      } else {   // IP 유저라면....
        Ipshot = IpId.split('.')[0] + '.' + IpId.split('.')[1]; 
      }
    }
  }

  function openAlert(e){   // 창 열고 닫기
    $(e.target).siblings('.AlertNode').css('display','flex');
  }

  function closeAlert(e){   // 창 열고 닫기
    $(e.target).parent().parent().hide();
  }

  function openDeletePosts(e){   // 창 열고 닫기
    $(e.target).siblings('.PostsDel').css('display','flex');
  }

  function closeDeletePosts(e){   // 창 열고 닫기
    $(e.target).parent().css('display','none');
  }

  async function uploadComment(e, postsNum){
    e.preventDefault();
    let [IP, IPUserCheck, IPUserBlock] = await checkBlock();
    let pw = CommentPW;
    const detail = convertToHTML(CommentInput);

    if(IPUserCheck){
      const postsnum=postsNum;  // 포스트 번호

      let ipshot, wrote;
      if(WroteCode===""){  // 글쓴이 식별자
        ipshot = IP.split('.')[0] + '.' + IP.split('.')[1]; // ipshot
        wrote = 0;
      } else {
        ipshot = ID;
        wrote = 1;
        pw="";
      }
      
      const code = uuidv4();   // code 값을 구한다.

      // 현재 날짜 값을 구한다.
      const currentDate = new Date();
      const uploadDate = currentDate.toISOString().slice(0, 19).replace('T', ' ');
    
    } else { 
      const dateStr = IPUserBlock[0].blockDate;
      const dateObj = new Date(dateStr);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1 해주고, 두 자리로 만들기 위해 padStart 사용
      const day = String(dateObj.getDate()).padStart(2, '0'); // 일자도 두 자리로 만들기 위해 padStart 사용

      const formattedDate = `${year}-${month}-${day}`;
      alert(`차단된 유저나 IP 입니다.\n차단 기한 : ~ ${formattedDate}KST \n차단 사유 : ${IPUserBlock[0].blockDetail}`); 
    }
  }

  
  // 포스트, 댓글 삭제할 수 있게 하는것도 구현하기
  function closeDeleteCommentAll(){
    $('.Home .LeftSide .PostsContext .CommentSide .CommentDel').hide();
  }

  function openDeleteComment(e){   // 창 열고 닫기
    $(e.target).siblings('.CommentDel').css('display','flex');
  }

  function closeDeleteComment(e){   // 창 열고 닫기
    $(e.target).parent().hide();
  }

  // 포스트 날짜 형식 수정
  function RewriteDate(dateString){
    if(dateString==="0000-00-00"){
      return null;
    } else{
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1 해줌
      const day = String(date.getDate()).padStart(2, '0');

      return `${year}.${month}.${day}`;
    }
  }

  function RewriteDateTime(dateString){
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1 해줌
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
  }

  // 포스트 아이콘 결정
  function PostTypeIcon(type) {
    let Con;
    switch (type) {
      case '사건':
        Con = 'img/cons/caseCon.png';
        break;
      case '사고':
        Con = 'img/cons/accidentCon.png';
        break;
      case '재해':
        Con = 'img/cons/disasterCon.png';
        break;
      case '보건':
        Con = 'img/cons/healthCon.png';
        break;
      case '결함':
        Con = 'img/cons/breakCon.png';
        break;
      default:
        Con = 'img/cons/caseCon.png';
        break;
    }
  
    return Con;
  }

  function convertToHTML(detail) {
    var htmlText = detail.replace(/&/g, '&amp;')
                          .replace(/</g, '&lt;')
                          .replace(/>/g, '&gt;')
                          .replace(/\n/g, '<br>');
    return htmlText;
  }  

  return (
    <div className='Home flex w-full'>
      { windowWidth > 900 ? 
      <div className='Home_PC flex w-full'>
        <div className='LeftSide flex flex-col w-full'>
          <div className='SearchNode flex w-full'>
            <div className='Search flex w-full items-center'>
              <input ref={KeywordRef} value={Keyword} onChange={(e)=>SetKeyword(e.target.value)} id="pac-input" type="text" placeholder="주소로 입력하시고, 엔터키를 누르세요." className='flex flex-1'/>
              <i className="fa-solid fa-magnifying-glass" ref={SearchRef}></i>  
              <i className="fa-solid fa-x" ref={BackMainRef}></i>
            </div>
          </div>  
          <div className='MainPart flex flex-col'>
            <div className='NewsPart flex flex-col mb-5 mt-5'>
              <div className='flex w-full gap-3 items-center'>
                <a href={`${window.location.origin}/News`} className='Title'>News</a> 
                <button className='ButtonForm2'><i className="fa-solid fa-arrow-rotate-right"></i></button>
              </div>
              <ul className='flex w-full flex-col'>
                {News.map((news, index)=>(
                <li className='flex' key={index}>
                  <a href={`${window.location.origin}/News?noticenum=${news.no}`} className='flex flex-1 gap-4'>
                    <p className='flex'>{index+1}</p>
                    <p className='flex flex-1'>{news.title}</p>
                    <p className='flex'>{RewriteDate(news.uploadDate)}</p>
                  </a>
                </li> ))}
              </ul>
            </div>
            <div className='EventPart flex flex-col mb-10'>
              <div className='flex w-full gap-3 items-center'>
                <a href={`${window.location.origin}/Event`} className='Title'>Event</a> 
                <button className='ButtonForm2'><i className="fa-solid fa-arrow-rotate-right"></i></button>
              </div>
              <ul className='flex w-full flex-col'>
                {Event.map((event, index)=>(
                <li className='flex' key={index}>
                  <a href={`${window.location.origin}/Event?noticenum=${event.no}`} className='flex flex-1 gap-4'>
                    <p className='flex'>{index+1}</p>
                    <p className='flex flex-1'>{event.title}</p>
                    <p className='flex'>{RewriteDate(event.uploadDate)}</p>
                  </a>
                </li> ))}
              </ul>
            </div>
            <div className='RecentPart flex flex-col'>
              <div className='RecentTab flex w-full items-end'>
                <div className='flex flex-1 items-center justify-center active' value="post" onClick={(e) => TabChoose("post")}>최근 업로드</div>
                <div className='flex flex-1 items-center justify-center' value="request" onClick={(e) => TabChoose("request")}>최근 댓글</div>
              </div>
              
              <div className='RecentPosts flex active'>
                <ul className='flex w-full flex-col'>
                  {Posts.map((posts, index) => (
                  <li className='PostsBars flex w-full items-center' key={index}>
                    <a href={`${window.location.origin}/?thenum=${posts.no}`} className='flex w-full gap-2 items-center'>
                      <p className='flex flex-1' title={posts.addr}>{posts.addr}</p>
                      <img className='flex ml-2' src={PostTypeIcon(posts.type)} title={posts.type}></img>
                      <p className='flex'>{RewriteDate(posts.uploadDate)}</p>
                    </a>
                  </li>
                  ))}
                </ul>
              </div>
              <div className='RecentRequest flex'>
                <ul className='flex w-full flex-col'>
                  {Comment.map((comment, index) => (    
                  <li className='PostsBars flex w-full' key={index}>
                    <a href={`${window.location.origin}/?thenum=${comment.postsnum}`} className='flex w-full gap-2'>
                      <div className='flex flex-1'>
                      {comment.detail.split('<br>').filter((line, index) => index === 0).map((line, index) => (
                          <p className='flex' key={index}>{line} ...</p>
                      ))}
                      </div>
                      <p className='flex' title='작성자 ID or IP'>{comment.Ipshot}</p>
                      <p className='flex'>{RewriteDate(comment.uploadDate)}</p>
                    </a>
                  </li>
                  ))}
                </ul> 
              </div>
            </div>
            <div className='Ads flex flex-col'>
            </div>
          </div> 
          <div className='SearchPart flex flex-col'>
            <ul className='SearchLocation flex flex-col'>
              {SearchLocation.map((searchloc, index) => (
              <div key={index} className='gap-3' onClick={(e) => handleMarkerClickL(index)}>
                <p className='flex gap-3 items-center'><i className="fa-solid fa-location-dot"></i> {searchloc.addr}</p>
                <p className='flex gap-3 items-center'><i className="fa-solid fa-location-crosshairs"></i> ( {searchloc.lat}, {searchloc.lng}) </p>
              </div> ))}
            </ul>
            {SearchLocation.length===1 ? 
            <ul className='SearchPosts flex'>
              <a href={`${window.location.origin}/Posting?addr=${SearchLocation[0].addr}&lat=${SearchLocation[0].lat}&lng=${SearchLocation[0].lng}`} 
                className='ButtonForm3' target='_blank'>이 장소로 포스팅하기</a>
            </ul> : null}
            {SearchLocation.length===1 ? 
            <ul className='SearchPosts flex gap-3'>
              <select value={filterordering} onChange={(e) => SetFilterordering(e.target.value)} className='flex'>
                <option value="최근 업로드">최근 업로드 순</option>
                <option value="인접 거리순">인접 거리순</option>
              </select>
              <select value={filterType} onChange={(e) => SetFilterType(e.target.value)} className='flex'>
                <option value="전체">전체</option>
                <option value="사건">사건</option>
                <option value="사고">사고</option>
                <option value="재해">재해</option>
                <option value="보건">보건</option>
                <option value="결함">결함</option>
              </select>
              <select value={filterRadius} onChange={(e) => SetFilterRadius(parseInt(e.target.value))} className='flex'>
                <option value="5">반경 5mile</option>
                <option value="10">반경 10mile</option>
                <option value="20">반경 20mile</option>
                <option value="30">반경 30mile</option>
              </select>
            </ul> : null}
            <div className='SearchPosts flex flex-col w-full items-center'>
              <ul className='flex w-full flex-col'>
                {PostsSearch.map((posts, index) => (
                <li className='PostsBars flex w-full gap-2 items-center' key={index} onClick={(e) => LoadPostsPage(posts.no)}>
                  <p className='flex flex-1' title={posts.addr}>{posts.addr}</p>
                  <img className='flex ml-2' src={PostTypeIcon(posts.type)} title={posts.type}></img>
                  <p className='flex'>{RewriteDate(posts.uploadDate)}</p>
                </li>
                ))}
              </ul>
            </div>
            <div className='SearchPosts flex flex-col w-full items-center'>
              {showMore ? <button className='flex' onClick={showMorePosts}>Show More</button>: <button className='flex' disabled>Show More</button> }
            </div>
          </div>
          {PostsPage==="" ? null :
          <div className='PostsContext flex w-full flex-col'> 
               
            {ShowPosts.map((posts, index)=>(
            <div className='PostsSide flex flex-col w-full' key={index}>
              <div className='PostControll flex items-center gap-3 mb-4'>
                <i className="ButtonForm1 flex fa-solid fa-arrow-left" title='뒤로 가기' onClick={QuitPostsPage}></i>
                <div className='flex flex-1'></div>
                <i className="ButtonForm1 flex fa-solid fa-link" title='url복사 공유' onClick={(e)=>PostLinkCopy(e, `${window.location.origin}/?thenum=${posts.no}`)}></i>
                <i className="ButtonForm1 flex fa-solid fa-circle-exclamation" onClick={openAlert} title='신고하기'></i>
             
                <div className='AlertNode flex flex-col gap-3'>
                  <select value={AlertType} onChange={(e)=>SetAlertType(e.target.value)} className='flex w-full' required>
                    <option value="" disabled>-- 신고 종류 선택하기 --</option>
                    {/* <option value="허위사실 유포">허위사실 유포</option> */}
                    <option value="모욕 · 명예훼손">모욕 · 명예훼손</option>
                    <option value="스팸 · 부적절한 광고">스팸 · 부적절한 광고</option>
                    {/* <option value="이의제기">이의제기</option> */}
                  </select>
                  <textarea className='flex w-full' wrap='hard' value={AlertDetail} rows={4} placeholder='신고상세*' onChange={(e)=>SetAlertDetail(e.target.value)} required/>
                  { !posts.wrote ? <input type='password' className='flex w-full' value={AlertPW} placeholder='비밀번호' onChange={(e)=>SetAlertPW(e.target.value)} /> : null}
                  <div className='flex gap-3'>
                    <div className='flex' onClick={(e)=>UploadAlert(e, posts.no, delPW, posts.wrote)}>신고하기</div>
                    <div className="flex" onClick={closeAlert}>그만두기</div>
                  </div>
                </div>
              </div>
            </div> ))}

            {ShowPosts.length===0 ? 
              <div className='PostControll flex items-center gap-3 mb-4'>
                <div onClick={QuitPostsPage} className='ButtonForm1 flex' title='뒤로 가기'>
                  <i className="fa-solid fa-arrow-left"></i>
                </div>
                <p>삭제된 포스트 입니다.</p>
              </div>         
            : null}
           
            <div className='CommentSide flex'>
              <ul className='flex flex-col gap-2 flex-1'>
                {ShowComments.map((comments, index)=>(
                  <li className='flex gap-2 flex-1'> 
                  <div className='flex flex-1 gap-4'>
                    <div className='flex'>{comments.Ipshot} </div>
                    <div className='flex flex-col'>
                      {comments.detail.split('<br>').map((line, index) => (
                      <pre className='flex' key={index}>{line}</pre>
                      ))}
                    </div>
                  </div>
                  
                  </li>
                ))}
              </ul>
            </div>            
          </div> }
        </div>
        <div className='RightSide flex flex-1'>
          <div className='MapNotice flex'>지도를 클릭해 마커를 찍어 검색해보세요.</div>
          <div className='CurrentLation flex ButtonForm1' title='현위치' ref={CurrentLoc}><i className="fa-solid fa-location-crosshairs"></i></div>
          <div ref={mapRef} style={{ height: '100%', width: '100%' }}></div>
        </div>
      </div> : 
      <div className='Home_MB flex w-full flex-col'>
        <div className='MapNotice flex flex-1'>지도를 클릭해 마커를 찍어 검색해보세요.</div>
        <div className='RightSide flex flex-1'>
          <div className='CurrentLation flex ButtonForm1' title='현위치' ref={CurrentLoc}><i className="fa-solid fa-location-crosshairs"></i></div>
          <div ref={mapRef} style={{ height: '240px', width: '100%' }}></div>
        </div>
        <div className='LeftSide flex flex-col w-full'>
          <div className='SearchNode flex flex-1'>
            <div className='Search flex w-full items-center'>
              <input ref={KeywordRef} value={Keyword} onChange={(e)=>SetKeyword(e.target.value)} id="pac-input" type="text" placeholder="주소로 입력하시고, 엔터키를 누르세요." className='flex flex-1'/>
              <i className="fa-solid fa-magnifying-glass" ref={SearchRef}></i>  
              <i className="fa-solid fa-x" ref={BackMainRef}></i>
            </div>
          </div>  
          <div className='MainPart flex-1 flex flex-col'>
            <div className='NewsPart flex flex-col mb-5 mt-5'>
              <div className='flex w-full gap-3 items-center'>
                <a href={`${window.location.origin}/News`} className='Title'>News</a> 
                <button className='ButtonForm2' ><i className="fa-solid fa-arrow-rotate-right"></i></button>
              </div>
              <ul className='flex w-full flex-col'>
                {News.map((news, index)=>(
                <li className='flex' key={index}>
                  <a href={`${window.location.origin}/News?noticenum=${news.no}`} className='flex flex-1 gap-4'>
                    <p className='flex'>{index+1}</p>
                    <p className='flex flex-1'>{news.title}</p>
                    <p className='flex'>{RewriteDate(news.uploadDate)}</p>
                  </a>
                </li> ))}
              </ul>
            </div>
            <div className='EventPart flex flex-col mb-10'>
              <div className='flex w-full gap-3 items-center'>
                <a href={`${window.location.origin}/Event`} className='Title'>Event</a> 
                <button className='ButtonForm2'><i className="fa-solid fa-arrow-rotate-right"></i></button>
              </div>
              <ul className='flex w-full flex-col'>
                {Event.map((event, index)=>(
                <li className='flex' key={index}>
                  <a href={`${window.location.origin}/Event?noticenum=${event.no}`} className='flex flex-1 gap-4'>
                    <p className='flex'>{index+1}</p>
                    <p className='flex flex-1'>{event.title}</p>
                    <p className='flex'>{RewriteDate(event.uploadDate)}</p>
                  </a>
                </li> ))}
              </ul>
            </div>
            <div className='RecentPart flex flex-col'>
              <div className='RecentTab flex w-full items-end'>
                <div className='flex flex-1 items-center justify-center active' value="post" onClick={(e) => TabChoose("post")}>최근 업로드</div>
                <div className='flex flex-1 items-center justify-center' value="request" onClick={(e) => TabChoose("request")}>최근 댓글</div>
              </div>
              
              <div className='RecentPosts flex active'>
                <ul className='flex w-full flex-col'>
                  {Posts.map((posts, index) => (
                  <li className='PostsBars flex w-full items-center' key={index}>
                    <a href={`${window.location.origin}/?thenum=${posts.no}`} className='flex w-full gap-2 items-center'>
                      <p className='flex flex-1' title={posts.addr}>{posts.addr}</p>
                      <img className='flex ml-2' src={PostTypeIcon(posts.type)} title={posts.type}></img>
                      <p className='flex'>{RewriteDate(posts.uploadDate)}</p>
                    </a>
                  </li>
                  ))}
                </ul>
              </div>
              <div className='RecentRequest flex'>
                <ul className='flex w-full flex-col'>
                  {Comment.map((comment, index) => (    
                  <li className='PostsBars flex w-full' key={index}>
                    <a href={`${window.location.origin}/?thenum=${comment.postsnum}`} className='flex w-full gap-2'>
                      <div className='flex flex-1'>
                      {comment.detail.split('<br>').filter((line, index) => index === 0).map((line, index) => (
                          <p className='flex' key={index}>{line} ...</p>
                      ))}
                      </div>
                      <p className='flex' title='작성자 ID or IP'>{comment.Ipshot}</p>
                      <p className='flex'>{RewriteDate(comment.uploadDate)}</p>
                    </a>
                  </li>
                  ))}
                </ul> 
              </div>
            </div>
            <div className='Ads flex flex-col'>
            </div>
          </div> 
          <div className='SearchPart flex flex-1 flex-col'>
            <ul className='SearchLocation flex flex-col'>
              {SearchLocation.map((searchloc, index) => (
              <div key={index} className='gap-3' onClick={(e) => handleMarkerClickL(index)}>
                <p className='flex gap-3 items-center'><i className="fa-solid fa-location-dot"></i> {searchloc.addr}</p>
                <p className='flex gap-3 items-center'><i className="fa-solid fa-location-crosshairs"></i> ( {searchloc.lat}, {searchloc.lng}) </p>
              </div> ))}
            </ul>
            {SearchLocation.length===1 ? 
            <ul className='SearchPosts flex'>
              <a href={`${window.location.origin}/Posting?addr=${SearchLocation[0].addr}&lat=${SearchLocation[0].lat}&lng=${SearchLocation[0].lng}`} 
                className='ButtonForm3' target='_blank'>이 장소로 포스팅하기</a>
            </ul> : null}
            {SearchLocation.length===1 ? 
            <ul className='SearchPosts flex gap-3'>
              <select value={filterordering} onChange={(e) => SetFilterordering(e.target.value)} className='flex'>
                <option value="최근 업로드">최근 업로드 순</option>
                <option value="인접 거리순">인접 거리순</option>
              </select>
              <select value={filterType} onChange={(e) => SetFilterType(e.target.value)} className='flex'>
                <option value="전체">전체</option>
                <option value="사건">사건</option>
                <option value="사고">사고</option>
                <option value="재해">재해</option>
                <option value="보건">보건</option>
                <option value="결함">결함</option>
              </select>
              <select value={filterRadius} onChange={(e) => SetFilterRadius(parseInt(e.target.value))} className='flex'>
                <option value="5">반경 5mile</option>
                <option value="10">반경 10mile</option>
                <option value="20">반경 20mile</option>
                <option value="30">반경 30mile</option>
              </select>
            </ul> : null }
            <div className='SearchPosts flex flex-col w-full items-center'>
              <ul className='flex w-full flex-col'>
                {PostsSearch.map((posts, index) => (
                <li className='PostsBars flex w-full gap-2 items-center' key={index} onClick={(e) => LoadPostsPage(posts.no)}>
                  <p className='flex flex-1' title={posts.addr}>{posts.addr}</p>
                  <img className='flex ml-2' src={PostTypeIcon(posts.type)} title={posts.type}></img>
                  <p className='flex'>{RewriteDate(posts.uploadDate)}</p>
                </li>
                ))}
              </ul>
            </div>
            <div className='SearchPosts flex flex-col w-full items-center'>
              {showMore ? <button className='flex' onClick={showMorePosts}>Show More</button>: <button className='flex' disabled>Show More</button> }
            </div>
          </div>
          {PostsPage==="" ? null :
          <div className='PostsContext flex flex-1 flex-col'> 
               
            {ShowPosts.map((posts, index)=>(
            <div className='PostsSide flex flex-col w-full' key={index}>
              <div className='PostControll flex items-center gap-3 mb-4'>
                <i className="ButtonForm1 flex fa-solid fa-arrow-left" onClick={QuitPostsPage} title='뒤로 가기'></i>
                <div className='flex flex-1'></div>
                <i className="ButtonForm1 flex fa-solid fa-link" title='url복사 공유' onClick={(e)=>PostLinkCopy(e, `${window.location.origin}/?thenum=${posts.no}`)} ></i>
                <i className="ButtonForm1 flex fa-solid fa-circle-exclamation" onClick={openAlert} title='신고하기'></i>
                
                <div className='AlertNode flex flex-col gap-3'>
                  <select value={AlertType} onChange={(e)=>SetAlertType(e.target.value)} className='flex w-full' required>
                    <option value="" disabled>-- 신고 종류 선택하기 --</option>
                    {/* <option value="허위사실 유포">허위사실 유포</option> */}
                    <option value="모욕 · 명예훼손">모욕 · 명예훼손</option>
                    <option value="스팸 · 부적절한 광고">스팸 · 부적절한 광고</option>
                    {/* <option value="이의제기">이의제기</option> */}
                  </select>
                  <textarea className='flex w-full' wrap='hard' value={AlertDetail} rows={4} placeholder='신고상세*' onChange={(e)=>SetAlertDetail(e.target.value)} required/>
                  { !posts.wrote ? <input type='password' className='flex w-full' value={AlertPW} placeholder='비밀번호' onChange={(e)=>SetAlertPW(e.target.value)} /> : null}
                  <div className='flex gap-3'>
                    <div className='flex' onClick={(e)=>UploadAlert(e, posts.no, delPW, posts.wrote)}>신고하기</div>
                    <div className="flex" onClick={closeAlert}>그만두기</div>
                  </div>
                </div>

               
                { !posts.wrote ? 
                <div className='PostsDel flex gap-3'>
                  <input type='password' className='flex flex-1' value={delPW} onChange={(e)=>SetdelPW(e.target.value)} /> 
                  <div className='flex' >확인하기</div>
                  <i className="fa-solid fa-x" onClick={closeDeletePosts}></i>                    
                </div> : null }

              </div>         
              <div className='flex w-full gap-2 items-center'>
                <p className='Title flex-1'>{posts.title}</p>
              </div>
              <div className='flex w-full gap-2'>
                <p className='flex' title='작성자'>{posts.Ipshot}</p>
                <p className='flex'> | </p>
                <p className='flex'>{RewriteDateTime(posts.uploadDate)} Upload</p>
              </div>
              <div className='Types flex gap-2 items-center'>
                <img className='flex' src={PostTypeIcon(posts.type)} title={posts.type}></img>
                <p className='flex'>{posts.type} · {posts.subtype}</p>
              </div>
              <div className='Location flex flex-col'>
                <p className='flex gap-3 items-center'><i className="fa-solid fa-location-dot"></i> {posts.addr}</p>
                <p className='flex gap-3 items-center'><i className="fa-solid fa-location-crosshairs"></i> ( {posts.latitude}, {posts.longitude}) </p>
              </div>
              <div className='flex gap-3 items-center'>
                <i className="fa-solid fa-calendar-days"></i> 
                <p>{RewriteDate(posts.dateSt)}</p> {RewriteDate(posts.dateEd)===null || RewriteDate(posts.dateEd)===undefined || RewriteDate(posts.dateEd)==="" ? null : <p >~ RewriteDate(posts.dateEd)</p>}
              </div>
              <div className='flex w-full flex-col'>
                {posts.detail.split('<br>').map((line, index) => (
                <pre className='flex' key={index}>{line}</pre>
                ))}
              </div>
              {posts.movie!=="" ? 
              <div className='flex w-full'> 
                <ReactPlayer url={posts.movie} key={index}
                width='100%' height='100%' muted={true} controls={false} playsinline={true} playing={false} loop={true}  /> 
              </div> : null}
              <div className='IMGBox flex gap-2 mb-10'>
                {posts.IMG1 !== "" ? <img className='flex' src={posts.IMG1} alt='관련이미지 1'></img> : null}
                {posts.IMG2 !== "" ? <img className='flex' src={posts.IMG2} alt='관련이미지 2'></img> : null}
                {posts.IMG3 !== "" ? <img className='flex' src={posts.IMG3} alt='관련이미지 3'></img> : null}
              </div>
              <div className='InputComment flex w-full'>
                <form onSubmit={(e)=>uploadComment(e, posts.no)} className='flex w-full flex-col gap-3'>
                  <textarea
                    wrap='hard'
                    value={CommentInput}
                    onChange={(e) => SetCommentInput(e.target.value)}
                    rows={4} // 입력 필드의 초기 높이를 설정합니다. 이 값은 필요에 따라 조정할 수 있습니다.
                    placeholder="허위사실 유포 및 명예훼손을 하는 댓글(정정요청)은 운영원칙 및 관련법률에 제재를 받을 수 있습니다.(500자 이내)" 
                    className='flex flex-1'
                    maxLength={500}
                    style={{ resize: 'vertical' }} // 세로로만 조절
                    required />
                  <div className='flex w-full justify-end gap-2'>
                    {!posts.wrote ? 
                    <input className='flex' type='password' placeholder='비밀번호* (20자 이내)' max={20} value={CommentPW} onChange={(e) => SetCommentPW(e.target.value)} required />: null}
                    <button className='ButtonForm1 flex' type='submit'>등록하기</button>
                  </div>
                </form>
              </div>
            </div> ))}

            {ShowPosts.length===0 ? 
              <div className='PostControll flex items-center gap-3 mb-4'>
                <div onClick={QuitPostsPage} className='ButtonForm1 flex' title='뒤로 가기'>
                  <i className="fa-solid fa-arrow-left"></i>
                </div>
                <p>삭제된 포스트 입니다.</p>
              </div>         
            : null}
           
            <div className='CommentSide flex'>
              <ul className='flex flex-col gap-2 flex-1'>
                {ShowComments.map((comments, index)=>(
                  <li className='flex gap-2 flex-1'> 
                  <div className='flex flex-1 gap-4'>
                    <div className='flex'>{comments.Ipshot} </div>
                    <div className='flex flex-col'>
                      {comments.detail.split('<br>').map((line, index) => (
                      <pre className='flex' key={index}>{line}</pre>
                      ))}
                    </div>
                  </div>
                  
                  { !comments.wrote ? <i className="ButtonForm2 fa-solid fa-x" onClick={openDeleteComment}></i> : 
                    <i className="ButtonForm2 fa-solid fa-x"></i> }
                    { !comments.wrote ? 
                    <div className='CommentDel flex gap-3'>
                      <input type='password' className='flex flex-1' value={delPW} onChange={(e)=>SetdelPW(e.target.value)} required /> 
                      <div className='flex'>확인하기</div>
                      <i className="fa-solid fa-x" onClick={closeDeleteComment}></i>                    
                    </div> : null }
                  </li>
                ))}
              </ul>
            </div>            
          </div> }
        </div>
      </div> }
    </div>
  );
}

export default Home;
