'use client';
import { Box, Typography, useMediaQuery } from '@mui/material';
import React from 'react';
import Image from 'next/image';
import cybrainLogo from '@/assets/Images/cybrain_logo.png';
import Link from 'next/link';

import 'react-phone-input-2/lib/style.css';

import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language';
import facebook from '@/assets/Images/facebook.png';
import twitterX from '@/assets/Images/twitter.png';
import instagram from '@/assets/Images/social.png';
import linkedin from '@/assets/Images/linkedin.png';


function FooterAuth() {

    const smallMobile = useMediaQuery('(min-width: 320px) and (max-width: 575px)');
    const biggerMobile = useMediaQuery('(min-width: 576px) and (max-width: 1024px)');
    const Mobile = useMediaQuery('(min-width: 320px) and (max-width: 5000px)');
    const Tablet = useMediaQuery('(min-width: 768px) and (max-width: 1024px)');
    const Desktop = useMediaQuery('(min-width: 1025px) and (max-width: 1199px)');

    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '15px', paddingRight: '20px', flexWrap: 'wrap', ...Mobile && {justifyContent: 'space-between', gap: '3px'}, paddingTop:'10px', paddingBottom:'10px', ...smallMobile && {justifyContent: 'center'}, }}>
            <Box className='footer-insider' sx={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
                 ...smallMobile && {justifyContent: 'center', gap: '3px'},
                 ...biggerMobile && {justifyContent: 'space-between', gap: '3px', width: '100%'}}}>
                <Typography variant="subtitle2" sx={{
                    color: '#000',
                    fontSize: '14px',
                    padding: '10px',
                    display: 'flex',
                    gap: '3px',
                    alignItems: 'center',
                    ...Mobile && {padding: '0px'}
                }}>
                    <PhoneIcon sx={{ color: '#027cc1' }} /> <Link href="tel:9216953958" style={{ color: '#000' }}> +91-9216953958</Link>
                    {" , "}
                    <Link href="tel:0172-5053958" style={{ color: '#000' }}>0172-5053958</Link>
                </Typography>
                <Typography variant="subtitle2" sx={{ color: '#000', fontSize: '14px', padding: '10px', display: 'flex', gap: '3px', alignItems: 'center',...Mobile && {padding: '0px'} }}>
                    <EmailIcon sx={{ color: '#027cc1' }} /> <Link href="mailto:info@cybrain.co.in" style={{ color: '#000' }}> info@cybrain.co.in</Link>
                </Typography>
                <Typography variant="subtitle2" sx={{ color: '#000', fontSize: '14px', padding: '10px', display: 'flex', gap: '3px', alignItems: 'center',...Mobile && {padding: '0px'} }}>
                    <LanguageIcon sx={{ color: '#027cc1' }} /><Link href="www.cybrain.co.in" target='_blank' style={{ color: '#000' }}> www.cybrain.co.in</Link>
                </Typography>
            </Box>
            <Box className='social-icons-foot' sx={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <Typography variant="body1" color="initial">Follow Us On: </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Typography sx={{ color: '#000', fontSize: '14px', }}>
                        <Link href="https://www.facebook.com/cybrainsoft/" target='_blank'>
                            <Image
                                src={facebook}
                                alt="facebook"
                                width={21}
                                height={21}
                                style={{
                                    objectFit: 'contain',
                                }}
                            /></Link>
                    </Typography>
                    <Typography sx={{ color: '#000', fontSize: '14px', }}>
                        <Link href="https://x.com/cybrainsoftware" target='_blank'>
                            <Image
                                src={twitterX}
                                alt="facebook"
                                width={21}
                                height={21}
                                style={{
                                    objectFit: 'contain',
                                }}
                            /></Link>
                    </Typography>
                    <Typography sx={{ color: '#000', fontSize: '14px', }}>
                        <Link href="https://www.instagram.com/cybrain.co.in/" target='_blank'>
                            <Image
                                src={instagram}
                                alt="facebook"
                                width={21}
                                height={21}
                                style={{
                                    objectFit: 'contain',
                                }}
                            /></Link>
                    </Typography>
                    <Typography sx={{ color: '#000', fontSize: '14px', }}>
                        <Link href="https://linkedin.com/company/cybrain-software-solutions/" target='_blank'>
                            <Image
                                src={linkedin}
                                alt="facebook"
                                width={21}
                                height={21}
                                style={{
                                    objectFit: 'contain',
                                }}
                            /></Link>
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <Typography variant="body1" color="initial">Powered by: </Typography>
                <Box>
                    <Link href="www.cybrain.co.in" target='_blank'>
                        <Image
                            src={cybrainLogo}
                            alt="logo"
                            width={99}
                            height={21}
                            style={{
                                objectFit: 'contain',
                            }}
                        /></Link>
                </Box>
            </Box>
        </Box>
    )
}

export default FooterAuth
