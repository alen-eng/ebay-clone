import { UserCircleIcon } from '@heroicons/react/24/solid';
import { 
   MediaRenderer,
   useContract ,
   useListing,
   useNetwork,
   useNetworkMismatch,
   useMakeBid,
   useMakeOffer,
   useOffers,
   useBuyNow,
   useAddress,
   useAcceptDirectListingOffer
  } from '@thirdweb-dev/react';
import { ListingType, NATIVE_TOKENS } from '@thirdweb-dev/sdk';
import { ethers } from 'ethers';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import Countdown from 'react-countdown';
import Header from '../../components/Header';
import network from '../../utils/network';
type Props = {}

function ListingCard () {
    const router= useRouter();
    const address= useAddress();
    const {listingId} = router.query as { listingId: string};
    const [BidAmount, setBidAmount] = useState("");
   const [ , switchNetwork] = useNetwork();
    const networkMismatch=useNetworkMismatch();
    const [minimumNextBid, setminimumNextBid]=useState<{
    displayValue:string,
    symbol: string
       }>()

  
      const {contract}= useContract (
      process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT,
      "marketplace"
       );
       const { mutate: makeBid} = useMakeBid(contract);

       const { data: offers } = useOffers(contract, listingId);

       const { mutate: makeOffer } = useMakeOffer(contract);

       const { mutate:buyNow } = useBuyNow(contract);

       const {data: listing, isLoading , error} = useListing(contract, listingId);

       const {mutate: acceptOffer} = useAcceptDirectListingOffer(contract);

       useEffect(() =>{
        if(!listingId || !contract || !listing) return;
        if(listing?.type===ListingType.Auction){
          fetchNextMinBid();
        }
       }, [listing, listingId, contract]);
 
       const fetchNextMinBid = async ()=>{
           if(!listingId || !contract) return;

           const {displayValue, symbol}= await contract.auction.getMinimumNextBid(listingId);
           setminimumNextBid({
            displayValue: displayValue,
            symbol: symbol,
           })
       }

      const formatPlaceholder = () =>{
          if(!listing) return;

           if(listing.type === ListingType.Direct){
            return "Enter Offer Amount.."
           }
           if(listing.type === ListingType.Auction){
            return Number(minimumNextBid?.displayValue)=== 0 
             ? "Enter Bid Amount"
             : `${minimumNextBid?.displayValue} ${minimumNextBid?.symbol} or more`;
           }
      };

      const buyNFT =  async () =>{
        if(networkMismatch){
          switchNetwork  && switchNetwork(network);
          return;
         }

         if(!listing || !contract || !listingId) return;
          await buyNow({
            id:listingId,
            buyAmount : 1,
            type:listing.type,
          },
          {
            onSuccess(data,variables,context){
              alert("NFT bought successfully!!");
              console.log("Success", data);
              router.replace('/')
            },
            onError(error,variables,context){
              alert("ERROR: NFT could not be bought!!");
              console.log("ERROR", error);
              
            }
          })
        
      }


      const createBidOffer = async () =>{
          try{
             if(networkMismatch){
              switchNetwork  && switchNetwork(network);
              return;
             }

             if(listing?.type === ListingType.Direct){
               if(listing.buyoutPrice.toString() === ethers.utils.parseEther(BidAmount).toString()){
                 console.log("Buyout Price met, buying NFT... ");
                 buyNFT();
                 return;
               }
               console.log("Buyout Price not met, making offer ... ");
                makeOffer({
                quantity: 1,
                listingId,
                pricePerToken:BidAmount,
               }, { 
                onSuccess(data, variables, context){
                    alert("Offer made successfully!!");
                    console.log("Success", data, variables, context);
                    router.replace('/');
                },
              })
             }
             if(listing?.type === ListingType.Auction){
               console.log("Making bid");

               await makeBid({
                listingId,
                bid:BidAmount,
               } ,{
                onSuccess(data,variables,context){
                  alert("Bid make successfully!!");
                  console.log("Success", data,variables,context);
                  setBidAmount('');
                },
                onError(error, variables, context){
                  alert("Error: Bid could not be made");
                  console.log("Error", error, variables,context);
                },
               });
             }
          }
          catch(error){
           console.log(error);
          }
      };

       if(isLoading){
        return <div>
         <Header/>
         <div className='text-center animate-pulse text-blue-500'> 
           <p>
             Loading Item...
             </p>
           </div>
           </div>
        }
       if(!listing){
        return <div> List not Found !! </div>
       }
  return (
    <div>
       <Header/>
       <main className='max-w-6xl mx-auto p-2 flex flex-col lg:flex-row space-y-10 space-x-5 pr-10'>
        <div className='p-10 border mx-auto lg:mx-0 max-w-md lg:max-w-xl'>
        <MediaRenderer src={listing?.asset.image}/>
        </div>
        <section className='flex-1 space-y-5 pb-20 lg:pb-0'>
          <div>
            <h1 className='text-xl font-bold'>{listing.asset.name}</h1>
            <p className='text-gray-600'>{listing.asset.description}</p>
            <p className='flex items-center text-xs sm:text-base mt-2'>
              <UserCircleIcon className='h-5'/>
              <span className='font-bold pr-1'>Seller: </span>{listing.sellerAddress}</p>
          </div>

          <div className='grid grid-cols-2 items-center py-2'>
            <p className='font-bold'>
               Listing Type :
            </p>
            <p>{listing.type === 0 ? 'Direct' : 'Auction'}</p>
            <p className='font-bold '>Buy it now Price :</p>
            <p className='text-4xl font-bold'>{listing.buyoutCurrencyValuePerToken.displayValue} {listing.buyoutCurrencyValuePerToken.symbol}</p>
          <button
           onClick={buyNFT}
          className='col-start-2 bg-blue-600 mt-2 font-bold text-white rounded-full w-44 py-4 px-10'>Buy Now</button>
          </div>
           {/* TODO: direct show offers here */}
           {listing.type === ListingType.Direct && offers! && (

            <div className='grid grid-cols-2 gap-y-2'>
              <p className='font-bold'>Offers: </p>
              <p className='font-bold'>{offers.length > 0 ? offers.length : 0}</p>

              {offers!?.map(offer =>(
              <>
               <p className='flex items-center ml-5 text-sm italic'>
                <UserCircleIcon className='h-3 mr-2'/>
                {offer.offeror.slice(0,5)+"..."+offer.offeror.slice(-5)}
               </p>
               <div>
                <p 
                key={offer.listingId + offer.offeror + offer.totalOfferAmount.tostring()}
                className='text-sm italic'>
                  {ethers.utils.formatEther(offer.totalOfferAmount)}{" "}{NATIVE_TOKENS[network].symbol}
                  </p>

                  {listing.sellerAddress === address && (
                   <button
                   onClick={()=> {
                    acceptOffer({
                       listingId,
                       addressOfOfferor: offer.offeror,
                    },
                    {
                      onSuccess(data,variables,context){
                         alert("Offer Accepted successfully!!");
                         console.log("Success",data,variables,context);
                         router.replace('/');
                      },
                      onError(error, variables, context) {
                          alert("Error: offer could not be accepted");
                          console.log("Error", error,variables,context);
                      },
                    });
                   }
                  }
                   className='p-2 w-32 bg-red-500/50 rounded-lg text-xs cursor-pointer'
                   >
                    Accept Offer
                   </button>
                  )}
               </div>
              </>
            ))}
            </div>
           )}
          
            

           <div className='grid grid-cols-2 space-y-2 items-center justify-end'>
            <hr className='col-span-2'/>
            <p className='col-span-2 font-bold'>
              {
                listing.type == ListingType.Direct
                ? "Make an Offer"
                : "Bid on this Auction"
              }
            </p>
            {/* TODO: Remaining time on auction goes here... */}
                  {listing.type=== ListingType.Auction && (
                    <>
                    <p>Current minimum Bid : </p>
                    <p className='font-bold'>{minimumNextBid?.displayValue} {minimumNextBid?.symbol}</p>
                    <p>Time remaining :</p>
                    <Countdown
                    date={Number(listing.endTimeInEpochSeconds) * 1000} 
                      />
                    </>
                  )}

            <input 
             className='border p-2 rounded-lg mr-5 '
             type='text'
             placeholder={formatPlaceholder()}
             onChange={e => setBidAmount(e.target.value)}
              />
            <button onClick={createBidOffer}
            className='bg-red-600 font-bold text-white rounded-full w-44 py-4 px-10'>
              {listing.type === ListingType.Direct ? "Offer" : "Bid" }
              </button>
           </div>
        </section>
       </main>
    </div>
   
  );
};

export default ListingCard ;