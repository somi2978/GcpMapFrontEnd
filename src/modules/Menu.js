import { React, useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import './Menu.css';

import $ from 'jquery'

function Menu(props) {

  const [ID, SetID] = useState(props.ID);
  const [WroteCode, SetWroteCode] = useState(props.WroteCode);

  useEffect(()=>{
    $('.Menu .MenuSide').removeClass('active');

  },[]);

  function OpenSide(){
    $('.Menu .MenuSide').addClass('active');
  }

  function CloseSide(){
    $('.Menu .MenuSide').removeClass('active');
  }

  function Logout(e){
    localStorage.removeItem('id');
    localStorage.removeItem('wrotecode');
    localStorage.removeItem('pw');
    window.location.reload();  // 새로고침
  }

  return (
    <div className='Menu KOTRA flex w-full'>
      <div className='Menu_PC flex w-full'>
        <div className='Logo flex items-center'>
          <a href={`${window.location.origin}/`} className='flex'>
            <img src='img/logo.png' alt="Logo"></img>
          </a>
        </div>
        <div className='RightSide flex flex-1 gap-5'>
          <div className='Ads flex flex-1'>

          </div>
          <div className='MenuCons flex items-center gap-5'>
            {ID==="" ? null : <Link to="/MyPage" className='flex items-center' ><i className="fa-solid fa-circle-user" title='사용자'></i></Link> }
            {ID==="" ? null : <div onClick={Logout} className='flex items-center'><i className="fa-solid fa-arrow-right-from-bracket" title='로그아웃'></i></div> }

            {ID==="" ? <Link to="/Login" className='flex items-center'><i className="fa-solid fa-arrow-right-to-bracket" title='로그인'></i></Link> : null}
            {/*{ID==="" ? <Link to="/Join" ><i className="fa-solid fa-user-plus" title='회원가입'></i></Link> : null} */}

            <i className="fa-solid fa-bars" onClick={OpenSide}></i>
          </div>
          <div className='MenuSide flex flex-col items-end'>
            <i className="fa-solid fa-x" onClick={CloseSide}></i>
            <ul className='flex flex-col w-full gap-8 mt-8'>
              <li className='flex w-full'><Link to="/Intro" onClick={CloseSide}>Intro</Link></li>
              <li className='flex w-full'><Link to="/Posting" onClick={CloseSide}>Posting</Link></li>
              <li className='flex w-full'><Link to="/News" onClick={CloseSide}>News</Link></li>
              <li className='flex w-full'><Link to="/Event" onClick={CloseSide}>Event</Link></li>
              <li className='flex w-full'><Link to="/MyPage" onClick={CloseSide}>MyPage</Link></li>
              <li className='flex w-full'><Link to="/Sponsor" onClick={CloseSide}>Sponsors</Link></li>
              {/* <li className='flex w-full'>
                <ul className='Contacts flex w-full'>
                  <li>소셜 & 콘택트 링크들</li>
                </ul>
              </li> */}
            </ul>
          </div>
          
        </div>
      </div>
      <div className='Menu_MB flex w-full items-center'>
        <div className='Logo flex h-full'>
          <a href={`${window.location.origin}/`} className='flex flex-1 items-center'>
            <img src='img/logo.png' alt="Logo"></img>
          </a>
        </div>
        <div className='RightSide flex flex-1 h-full gap-5'>
          <div className='Ads flex flex-1'>

          </div>
          <div className='MenuCons flex items-center gap-5'>
            

            

            <i className="fa-solid fa-bars" onClick={OpenSide}></i>
          </div>
          <div className='MenuSide flex flex-col w-full items-end'>
            <i className="fa-solid fa-x" onClick={CloseSide}></i>

            <div className='MenuMember flex w-full'>
              {ID==="" ? null : <Link to="/MyPage" className='flex flex-1' ><i className="fa-solid fa-circle-user" title='사용자'></i></Link> }
              {ID==="" ? null : <div onClick={Logout} className='flex flex-1'><i className="fa-solid fa-arrow-right-from-bracket" title='로그아웃'></i></div> }
              {ID==="" ? <Link to="/Login" className='flex flex-1 items-center justify-center gap-3'><i className="fa-solid fa-arrow-right-to-bracket" title='로그인'></i> Login</Link> : null}
              {/*{ID==="" ? <Link to="/Join" ><i className="fa-solid fa-user-plus" title='회원가입'></i></Link> : null} */}
            </div>

            <ul className='flex flex-col w-full gap-5'>
              <li className='flex w-full'><Link to="/Intro" className='flex flex-1' onClick={CloseSide}>Intro</Link></li>
              <li className='flex w-full'><Link to="/Posting" className='flex flex-1' onClick={CloseSide}>Posting</Link></li>
              <li className='flex w-full'><Link to="/News" className='flex flex-1' onClick={CloseSide}>News</Link></li>
              <li className='flex w-full'><Link to="/Event" className='flex flex-1' onClick={CloseSide}>Event</Link></li>
              <li className='flex w-full'><Link to="/MyPage" className='flex flex-1' onClick={CloseSide}>MyPage</Link></li>
              <li className='flex w-full'><Link to="/Sponsor" className='flex flex-1' onClick={CloseSide}>Sponsor</Link></li>
              {/* <li className='flex w-full'>
                <ul className='Contacts flex w-full'>
                  <li>소셜 & 콘택트 링크들</li>
                </ul>
              </li> */}
            </ul>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default Menu;
