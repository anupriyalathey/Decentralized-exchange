import React, {useState, useEffect} from 'react'
import {Input, Popover, Radio, Modal} from 'antd'
import {
  ArrowDownOutlined,
  DownOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import tokenList from '../tokenList.json'
import axios from 'axios'

function Swap() {
  const[slippage, setSlippage] = useState(2.5);
  const[tokenOneAmount, setTokenOneAmount] = useState(null);
  const[tokenTwoAmount, setTokenTwoAmount] = useState(null);
  const [tokenOne, setTokenOne] = useState(tokenList[0]);
  const [tokenTwo, setTokenTwo] = useState(tokenList[1]);
  const [isOpen, setIsOpen] = useState(false);
  const [changeToken, setChangeToken] = useState(1);
  const [prices, setPrices] = useState(null);
  
  function handleSlippageChange(e) {
    setSlippage(e.target.value);
  }

  function changeAmount(e) {
    setTokenOneAmount(e.target.value);
    if(e.target.value && prices) {
      setTokenTwoAmount((e.target.value*prices.ratio).toFixed(2)) //toFixed(2): till 2 decimal points
    }else{
      setTokenTwoAmount(null); //if token1 input field cleared, clear 2nd also
    }
   }

  function switchToken() {
    setPrices(null);
    setTokenOneAmount(null);
    setTokenTwoAmount(null);
    // such that after each switch, the token prices are fetched again
    const one = tokenOne;
    const two = tokenTwo;
    setTokenOne(two);
    setTokenTwo(one);
  }

  function openModal(asset) {
    setChangeToken(asset);
    setIsOpen(true);
  }

  function modifyToken(i) {
    setPrices(null);
    setTokenOneAmount(null);
    setTokenTwoAmount(null);
    // such that after each modification, the token prices are fetched again
    if(changeToken === 1) { // i.e. if token 1 changed
      setTokenOne(tokenList[i]);
      // fetchPrices(tokenList[i].address, tokenTwo.address);
    } else {
      setTokenTwo(tokenList[i]);
      
    }
    setIsOpen(false);
  }

  // async function fetchPrices(one, two) {
  //   const res = await axios.get('http://localhost:3001/tokenPrice', {
  //     params: {addressOne: one, addressTwo: two}})

  //     console.log(res.data);
  //     setPrices(res.data);
  // }

  // useEffect(()=> {
  //   fetchPrices(tokenList[0].address, tokenList[1].address) //making usdc and link default
  // })
  
  const settings = (
    <>
    <div>Slippage Tolerance</div>
    <div>
      <Radio.Group value={slippage} onChange={handleSlippageChange}>
        <Radio.Button value="0.5">0.5%</Radio.Button>
        <Radio.Button value="2.5">2.5%</Radio.Button>
        <Radio.Button value="5">5%</Radio.Button>
      </Radio.Group>
    </div>
    </>
  )
    return (
      <> 
    <Modal 
      open={isOpen}
      footer={null}
      onCancel={() => setIsOpen(false)}
      title="Select a token"
    >
      <div className='modalContent'>
        {tokenList?.map((e,i)=> {
          return (
            // <></>
            <div className='tokenChoice'
            key={i}
            onClick={()=>modifyToken(i)}
            >
            <img src={e.img} alt={e.ticker} className='tokenLogo' />
            <div className='tokenChoiceNames'>
              <div className='tokenName'>{e.name}</div>
              <div className='tokenTicker'>{e.ticker}</div>
            </div>
            </div>
          )
        })}
      </div>
      </Modal>
    <div className="tradeBox">
      <div className="tradeBoxHeader">
        <h4>Swap</h4>
        <Popover content={settings} title="Settings" trigger="click" placement="bottomRight" >
        <SettingOutlined className="cog" />
        </Popover>
      </div>
      <div className='inputs'>
        <Input 
          placeholder="0" 
          value={tokenOneAmount} 
          onChange={changeAmount}
          disabled={!prices} //disables input field when prices not fetched
          />

        <Input 
          placeholder="0" 
          value={tokenTwoAmount} 
          disabled={true} 
          /> {/*  disabled: true since here we'll be using moralis token api to get the price */}
        <div className='switchButton' onClick={switchToken}>
          <ArrowDownOutlined className="switchArrow" />
        </div>
        <div className="assetOne" onClick={() => openModal(1)}>
          <img src={tokenOne.img} alt="assetOneLogo" className="assetLogo" />
          {tokenOne.ticker}
          <DownOutlined />
        </div>
        <div className="assetTwo" onClick={() => openModal(2)}>
          <img src={tokenTwo.img} alt="assetTwoLogo" className="assetLogo" />
          {tokenTwo.ticker}
          <DownOutlined />
        </div>     
    </div>
    <div className='swapButton' disabled={!tokenOneAmount}> 
    {/* Swap button disabled when no value in token1 */}
      Swap
      </div> 
    </div>
    </>  
  )
}

export default Swap