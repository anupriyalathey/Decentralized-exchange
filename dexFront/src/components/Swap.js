import React, {useState, useEffect} from 'react'
import {Input, Popover, Radio, Modal, message} from 'antd'
import {
  ArrowDownOutlined,
  DownOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import tokenList from '../tokenList.json'
import axios from 'axios'
import {useSendTransaction, useWaitForTransaction} from "wagmi"


function Swap(props) {
  const {address, isConnected} = props;
  const [messageApi, contextHolder] = message.useMessage();
  const[slippage, setSlippage] = useState(2.5);
  const[tokenOneAmount, setTokenOneAmount] = useState(null);
  const[tokenTwoAmount, setTokenTwoAmount] = useState(null);
  const [tokenOne, setTokenOne] = useState(tokenList[0]);
  const [tokenTwo, setTokenTwo] = useState(tokenList[1]);
  const [isOpen, setIsOpen] = useState(false);
  const [changeToken, setChangeToken] = useState(1);
  const [prices, setPrices] = useState(null);
  const [txDetails, setTxDetails] = useState({
    to: null,
    data: null, // that 1inch api will return to us when swap is requested
    value: null, // 0 since swapping erc20 to erc20 token
  })
  
const {data, sendTransaction} = useSendTransaction({
  request: {
    from: address,
    to: String(txDetails.to),
    data: String(txDetails.data),
    value: String(txDetails.value),
  }
})

const{isLoading, isSuccess} = useWaitForTransaction({
  hash: data?.hash,
})

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

  async function fetchPrices(one, two) {
    const res = await axios.get(`http://localhost:3001/tokenPrice`, {
      params: {addressOne: one, addressTwo: two}})

      // console.log(res.data);
      setPrices(res.data);
  }

  async function fetchDexSwap() {
    // approve->allowance: Get the number of tokens that the 1inch Router is allowed to swap
    // approve->transaction: Generate approve calldata to allow 1inch Router to perform a swap

    const allowance = await axios.get(`https://api.1inch.io/v5.2/1/approve/allowance?tokenAddress=${tokenOne.address}&walletAddress=${address}`)

    if(allowance.data.allowance === '0') {
      const approve = await axios.get(`https://api.1inch.io/v5.2/1/approve/transaction?tokenAddress=${tokenOne.address}`)
    
      setTxDetails(approve.data)
      console.log("not approved")
      return 

    }
    const tx = await axios.get(`https://api.1inch.io/v5.2/1/swap?fromTokenAddress=${tokenOne.address}&toTokenAddress=${tokenTwo.address}&amount=${tokenOneAmount.padEnd(tokenOne.decimal+tokenOneAmount.length,'0')}&fromAddress=${address}&slippage=${slippage}`)
    
    let decimals = Number(`1E${tokenTwo.decimals}`) // converting decimals to number from tx response
    
    setTokenTwoAmount((Number(tx.data.toTokenAmount)/decimals).toFixed(2));
    setTxDetails(tx.data.tx);
  }

  useEffect(()=> {
    fetchPrices(tokenList[0].address, tokenList[1].address) //making usdc and link default
  })

  useEffect(()=>{
    if(txDetails.to && isConnected) {
      sendTransaction(); // wagmi hook
    }
  }, [txDetails])

  useEffect(()=> {
    messageApi.destroy(); // if any previous message exists, destroy it
    if(isLoading) {
      messageApi.open({
        type: 'loading',
        content: 'Transaction is pending...',
        duration: 0,
      })
    }
  },[isLoading])

  useEffect(()=> {
    messageApi.destroy(); // if any previous message exists, destroy it
    if(isSuccess) {
      messageApi.open({
        type: 'success',
        content: 'Transaction successful!',
        duration: 1.5,
      })
      }
      else if(txDetails.to) {
        messageApi.open({
          type: 'error',
          content: 'Transaction failed!',
          duration: 1.5,
        })
      }
  },[isSuccess])
  
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
      {contextHolder}
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
    <div className='swapButton' disabled={!tokenOneAmount || !isConnected} onClick={fetchDexSwap}> 
    {/* Swap button disabled when no value in token1 */}
      Swap
      </div> 
    </div>
    </>  
  )
}

export default Swap