import React, { FormEvent, useState } from 'react'
import Header from '../components/Header'
import { 
    useAddress,
    useContract,
    MediaRenderer,
    useNetwork,
    useNetworkMismatch,
    useOwnedNFTs,
    useCreateAuctionListing,
    useCreateDirectListing
} from '@thirdweb-dev/react'
import { ChainId, NFT , NATIVE_TOKENS, NATIVE_TOKEN_ADDRESS} from '@thirdweb-dev/sdk';
import network from '../utils/network';
import { useRouter } from 'next/router';



type Props = {}

function createListing({}: Props) {
    const address= useAddress();
    const router = useRouter();
    const {contract}= useContract(
        process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT,
        'marketplace'
    );

    const [selectedNFT , setselectedNFT]= useState<NFT>();
    const {contract: collectionContract}= useContract(
        process.env.NEXT_PUBLIC_COLLECTION_CONTRACT,
        'nft-collection'
    );

  const ownedNFTs= useOwnedNFTs(collectionContract , address);

  const networkMismatch= useNetworkMismatch();
  const [,switchNetwork]= useNetwork();
  const {
      mutate: createDirectListing,
      isLoading,
      error } = useCreateDirectListing(contract);

      const {
        mutate: createAuctionListing,
        isLoading : isLoadingAuction,
        error : errorAuction } = useCreateAuctionListing(contract);

const handleCreateListing= async (e: FormEvent<HTMLFormElement>) =>{
    e.preventDefault();
if(networkMismatch){
    switchNetwork  && switchNetwork(network);
    return;
}

if(!selectedNFT) return;

const target= e.target as typeof e.target & {
    elements :{listingType: {value: string}, Price:{value:string} }
   };

const {listingType, Price}= target.elements;

if(listingType.value=== 'directListing'){
createDirectListing({
    assetContractAddress: process.env.NEXT_PUBLIC_COLLECTION_CONTRACT!,
    tokenId: selectedNFT.metadata.id,
    currencyContractAddress: NATIVE_TOKEN_ADDRESS,
    listingDurationInSeconds: 60 * 60 * 24 * 7,
    quantity: 1,
    buyoutPricePerToken: Price.value,
    startTimestamp: new Date()
},  {
    onSuccess(data, variables, context) {
        console.log("Success : ", data, variables, context);
        router.push('/');
    },
    onError(error,variables,context){
        console.log('Error : ', error,variables,context)
    },
}
);
}
if(listingType.value==='auctionListing'){
    createAuctionListing({
        assetContractAddress: process.env.NEXT_PUBLIC_COLLECTION_CONTRACT!,
        buyoutPricePerToken:Price.value,
        tokenId: selectedNFT.metadata.id,
        startTimestamp:new Date(),
        currencyContractAddress: NATIVE_TOKEN_ADDRESS,
        listingDurationInSeconds: 60 * 60 * 24 * 7,
        quantity: 1,
        reservePricePerToken: 0,
    },
    {
        onSuccess(data, variables, context) {
            console.log("Success : ", data, variables, context);
            router.push('/');
        },
        onError(error,variables,context){
            console.log('Error : ', error,variables,context)
        },
    });
 }
};
  return (
    <div>
        <Header/>

        <main className='max-w-6xl mx-auto p-10 pt-2'>
            <h1 className='text-4xl font-bold'>List an Item</h1>
            <h2 className='text-xl font-semibold pt-5'>Select an Item you would like to Sell</h2>
            <hr className='mb-5'/>
            <p>Below you will find the NFT's you own in your Wallet.</p>
            <div className='flex overflow-x-scroll space-x-2 p-4'>
               {ownedNFTs?.data?.map(nft => (
                    <div className={`flex flex-col space-y-2 card min-w-fit border-2 bg-gray-100
                     ${nft.metadata.id=== selectedNFT?.metadata.id ? 'border-black' : 'border-transparent'}`}
                     key={nft.metadata.id}
                     onClick={()=> setselectedNFT(nft)}>
                       <MediaRenderer className='h-48  rounded-lg' src={nft.metadata.image}/>
                       <p className='text-lg truncate font-bold'>{nft.metadata.name}</p>
                       <p className='text-xs truncate'>{nft.metadata?.description}</p>
                    </div>
               )) }
            </div>
        {selectedNFT && (
            <form onSubmit={handleCreateListing}>
                <div className=' flex flex-col p-10'>
                    <div className='grid grid-cols-2 gap-5  '>
                        <label className='border-r font-light'>Direct/Fixed Listing</label>
                        <input type='radio' name='listingType'
                        value='directListing' className='ml-auto h-10 w-10'/>

                        <label className='border-r font-light'>Auction </label>
                        <input type='radio' name='listingType'
                        value='auctionListing' className='ml-auto h-10 w-10'/>

                        <label className='border-r font-light'>Price</label>
                        <input type='text' name='Price'
                        placeholder='0.005' className='bg-gray-100 p-5'/>
                    </div>
                    <button className='bg-blue-600 text-white rounded-lg p-4 mt-8' type='submit'>
                        Create Listing
                    </button>
                </div>
            </form>
            )
            }

        </main>
    </div>
  )

}

export default createListing