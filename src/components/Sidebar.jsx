import styled from "styled-components";
import logo from "../assets/logo.png";
import { v } from "../styles/Variables";
import {
  AiOutlineLeft,
  AiOutlineHome,
  AiOutlineApartment,
  AiOutlineSetting,
  AiTwotoneReconciliation
} from "react-icons/ai";
import { MdOutlineAnalytics, MdLogout, MdAppRegistration, MdOutlineInventory, MdAssignmentAdd } from "react-icons/md";
import { TbTruckDelivery } from "react-icons/tb";
import { IoReceiptSharp } from "react-icons/io5";
import { NavLink } from "react-router-dom";
import { useContext } from "react";
import { ThemeContext } from "../App";

export function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const ModSidebaropen = () => {
    setSidebarOpen(!sidebarOpen);
  };
  const { setTheme, theme } = useContext(ThemeContext);
  const CambiarTheme = () => {
    setTheme((theme) => (theme === "light" ? "dark" : "light"));
  };

  return (
    <Container isOpen={sidebarOpen} themeUse={theme}>
      <button className="Sidebarbutton" onClick={ModSidebaropen}>
        <AiOutlineLeft />
      </button>
      <div className="Logocontent">
        <div className="imgcontent">
          <img src={logo} alt="Logo Ancestral" />
        </div>
      </div>
      {linksArray.map(({ icon, label, to }) => (
        <div className="LinkContainer" key={label}>
          <NavLink
            to={to}
            className={({ isActive }) => `Links${isActive ? ` active` : ``}`}
          >
            <div className="Linkicon">{icon}</div>
            {sidebarOpen && <span>{label}</span>}
          </NavLink>
        </div>
      ))}
      <Divider />
      {secondarylinksArray.map(({ icon, label, to }) => (
        <div className="LinkContainer" key={label}>
          <NavLink
            to={to}
            className={({ isActive }) => `Links${isActive ? ` active` : ``}`}
          >
            <div className="Linkicon">{icon}</div>
            {sidebarOpen && <span>{label}</span>}
          </NavLink>
        </div>
      ))}
      <Divider />
      <div className="Themecontent">
        {sidebarOpen && <span className="titletheme">Apariencia</span>}
        <div className="Togglecontent">
          <div className="grid theme-container">
            <div className="content">
              <div className="demo">
                <label className="switch" istheme={theme}>
                  <input
                    istheme={theme}
                    type="checkbox"
                    className="theme-swither"
                    onClick={CambiarTheme}
                  ></input>
                  <span istheme={theme} className="slider round"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}

//#region Data links
const linksArray = [
  {
    label: "Inicio",
    icon: <AiOutlineHome />,
    to: "/",
  },
  {
    label: "Inventario",
    icon: <MdOutlineInventory />,
    to: "/inventario",
  },
  {
    label: "Entregas",
    icon: <TbTruckDelivery />,
    to: "/salidas",
  },
  {
    label: "Recepciones",
    icon: <IoReceiptSharp />,
    to: "/recepcion",
  },
  {
    label: "Gestión",
    icon: <MdAssignmentAdd />,
    to: "/registros",
  },
  {
    label: "Clientes",
    icon: <AiTwotoneReconciliation />,
    to: "/clientes",
  }
];

const secondarylinksArray = [
  {
    label: "Configuración",
    icon: <AiOutlineSetting />,
    to: "/configuracion",
  },
];
//#endregion

//#region STYLED COMPONENTS
const Container = styled.div`
  color: ${(props) => props.theme.text};
  background: ${(props) => props.theme.bg};
  position: sticky;
  padding-top: 15px; /* Reduced from 20px */
  height: 100vh;
  z-index: 1000;
  
  .Sidebarbutton {
    position: absolute;
    top: ${v.lgSpacing}; /* Slightly smaller spacing */
    right: -16px; /* Reduced from -18px */
    width: 28px; /* Reduced from 32px */
    height: 28px; /* Reduced from 32px */
    border-radius: 50%;
    background: ${(props) => props.theme.bgtgderecha};
    box-shadow: 0 0 3px ${(props) => props.theme.bg3},
      0 0 6px ${(props) => props.theme.bg};
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;
    transform: ${({ isOpen }) => (isOpen ? `initial` : `rotate(180deg)`)};
    border: none;
    letter-spacing: inherit;
    color: inherit;
    font-size: inherit;
    text-align: inherit;
    padding: 0;
    font-family: inherit;
    outline: none;
    z-index: 1001;
  }
  
  .Logocontent {
    display: flex;
    justify-content: center;
    align-items: center;
    padding-bottom: ${v.mdSpacing}; /* Reduced from lgSpacing */
    
    .imgcontent {
      display: flex;
      img {
        max-width: 70%; /* Reduced from 80% */
        height: auto;
      }
      cursor: pointer;
      transition: all 0.3s;
      transform: ${({ isOpen }) => (isOpen ? `scale(0.7)` : `scale(1.0)`)};
    }
    
    h2 {
      display: ${({ isOpen }) => (isOpen ? `block` : `none`)};
      font-size: 1.2rem; /* Added slight reduction if needed */
    }
  }
  
  .LinkContainer {
    margin: 6px 0; /* Reduced from 8px */
    padding: 0 10%; /* Reduced from 15% */
    
    :hover {
      background: ${(props) => props.theme.bg3};
    }
    
    .Links {
      display: flex;
      align-items: center;
      text-decoration: none;
      padding: calc(${v.smSpacing} - 2px) 0;
      color: ${(props) => props.theme.text};
      height: 45px; /* Reduced from 50px */
      
      .Linkicon {
        padding: ${v.smSpacing} ${v.smSpacing}; /* Reduced mdSpacing to sm */
        display: flex;

        svg {
          font-size: 20px; /* Reduced from 25px */
        }
      }
      
      &.active {
        .Linkicon {
          svg {
            color: ${(props) => props.theme.bg4};
          }
        }
      }
    }
  }
  
  .Themecontent {
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .titletheme {
      display: block;
      padding: 8px; /* Reduced from 10px */
      font-weight: 700;
      font-size: 0.9rem; /* Slight reduction */
      opacity: ${({ isOpen }) => (isOpen ? `1` : `0`)};
      transition: all 0.3s;
      white-space: nowrap;
      overflow: hidden;
    }
    
    .Togglecontent {
      margin: ${({ isOpen }) => (isOpen ? `auto 30px` : `auto 12px`)}; /* Reduced from 40px/15px */
      width: 32px; /* Reduced from 36px */
      height: 18px; /* Reduced from 20px */
      border-radius: 9px; /* Adjusted proportionally */
      transition: all 0.3s;
      position: relative;
      
      .theme-container {
        background-blend-mode: multiply, multiply;
        transition: 0.4s;
        
        .grid {
          display: grid;
          justify-items: center;
          align-content: center;
          height: 100vh;
          width: 100vw;
          font-family: "Lato", sans-serif;
        }
        
        .demo {
          font-size: 28px; /* Reduced from 32px */
          
          .switch {
            position: relative;
            display: inline-block;
            width: 54px; /* Reduced from 60px */
            height: 30px; /* Reduced from 34px */
            
            .theme-swither {
              opacity: 0;
              width: 0;
              height: 0;
              
              &:checked + .slider:before {
                left: 4px;
                content: "🌑";
                transform: translateX(24px); /* Adjusted from 26px */
              }
            }
            
            .slider {
              position: absolute;
              cursor: pointer;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: ${({ themeUse }) =>
                themeUse === "light" ? v.lightcheckbox : v.checkbox};
              transition: 0.4s;
              
              &::before {
                position: absolute;
                content: "☀️";
                height: 0px;
                width: 0px;
                left: -10px;
                top: 14px; /* Adjusted from 16px */
                line-height: 0px;
                transition: 0.4s;
              }
              
              &.round {
                border-radius: 30px; /* Adjusted from 34px */
                
                &::before {
                  border-radius: 50%;
                }
              }
            }
          }
        }
      }
    }
  }
`;

const Divider = styled.div`
  height: 1px;
  width: 100%;
  background: ${(props) => props.theme.bg3};
  margin: ${v.mdSpacing} 0; /* Reduced from lgSpacing */
`;
//#endregion