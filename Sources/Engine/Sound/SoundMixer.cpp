/* Copyright (c) 2002-2012 Croteam Ltd.
This program is free software; you can redistribute it and/or modify
it under the terms of version 2 of the GNU General Public License as published by
the Free Software Foundation


This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License along
with this program; if not, write to the Free Software Foundation, Inc.,
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA. */

#include "stdh.h"

#include <Engine/Sound/SoundProfile.h>
#include <Engine/Sound/SoundDecoder.h>
#include <Engine/Sound/SoundLibrary.h>
#include <Engine/Sound/SoundData.h>
#include <Engine/Sound/SoundObject.h>
#include <Engine/Base/Statistics_Internal.h>
#include <Engine/Base/Console.h>

// asm shortcuts
#define O offset
#define Q qword ptr
#define D dword ptr
#define W  word ptr
#define B  byte ptr

#define ASMOPT 1


// console variables for volume
extern FLOAT snd_fMasterVolume;
extern FLOAT snd_fSoundVolume;
extern FLOAT snd_fMusicVolume;
extern FLOAT snd_fVoiceVolume;
extern INDEX snd_bMono;


// a bunch of local vars coming up

static SLONG slMixerBufferSampleRate;  // quality of destination buffer
static SLONG slMixerBufferSize;        // size in samples per channel of the destination buffers
static void* pvMixerBuffer;            // pointer to the start of the destination buffers

static CSoundData* psd;
static SWORD* pswSrcBuffer;
static SLONG slLeftVolume, slRightVolume, slLeftFilter, slRightFilter;
static SLONG slLastLeftSample, slLastRightSample, slSoundBufferSize;
static FLOAT fSoundSampleRate, fPhase;
static FLOAT fOfsDelta, fStep, fLeftStep, fRightStep, fLeftOfs, fRightOfs;
static __int64 fixLeftOfs, fixRightOfs; // fixed integers 32:32
static __int64 mmSurroundFactor, mmLeftStep, mmRightStep, mmVolumeGain;
static BOOL bNotLoop, bEndOfSound;

static const FLOAT f65536 = 65536.0f;
static const FLOAT f4G = 4294967296.0f;
static __int64 mmInvFactor = 0x00007FFF00007FFF;
static __int64 mmMaskLD = 0x00000000FFFFFFFF;
static __int64 mmUnsign2Sign = 0x8000800080008000;



// reset mixer buffer (wipes it with zeroes and remembers pointers in static mixer variables)
void ResetMixer(const SLONG* pslBuffer, const SLONG slBufferSize)
{
    // clamp master volumes
    snd_fMasterVolume = Clamp(snd_fMasterVolume, 0.0f, 1.0f);
    snd_fSoundVolume  = Clamp(snd_fSoundVolume,  0.0f, 1.0f);
    snd_fMusicVolume  = Clamp(snd_fMusicVolume,  0.0f, 1.0f);
	snd_fVoiceVolume  = Clamp(snd_fVoiceVolume,  0.0f, 1.0f);

    // cache local variables
    ASSERT(slBufferSize % 4 == 0);
    pvMixerBuffer = (void*)pslBuffer;
    slMixerBufferSize = slBufferSize / 2 / 2; // because it's stereo and 16-bit dst format
    slMixerBufferSampleRate = _pSound->sl_SwfeFormat.nSamplesPerSec;

    // wipe destination mixer buffer
    memset(pvMixerBuffer, 0, slMixerBufferSize * 8);
}


// copy mixer buffer to the output buffer(s)
void CopyMixerBuffer_stereo(const SLONG slSrcOffset, void* pDstBuffer, const SLONG slBytes)
{
    ASSERT(pDstBuffer != NULL);
    ASSERT(slBytes % 4 == 0);
    if (slBytes < 4) return;
    memcpy(pDstBuffer, ((const char*)pvMixerBuffer) + slSrcOffset, slBytes);
}


// copy one channel from mixer buffer to the output buffer(s)
void CopyMixerBuffer_mono(const SLONG slSrcOffset, void* pDstBuffer, const SLONG slBytes)
{
    ASSERT(pDstBuffer != NULL);
    ASSERT(slBytes % 2 == 0);
    if (slBytes < 4) return;
    WORD* dst = (WORD*)pDstBuffer;
    WORD* src = (WORD*)(((UINT8*)pvMixerBuffer) + slSrcOffset);

    SLONG max = slBytes / 4;

    for (SLONG i = 0; i < max; i++)
    {
        *dst = *src;
        dst += 1; // Move 16 bits
        src += 2; // Move 32 bits
    }
}


// plain conversion of mixer buffer from 32-bit to 16-bit clamped
static void ConvertMixerBuffer(const SLONG slBytes)
{
    ASSERT(slBytes % 4 == 0);
    if (slBytes < 4) return;
    WORD* dst = (WORD*)pvMixerBuffer;
    DWORD* src = (DWORD*)pvMixerBuffer;
    SLONG max = slBytes / 2;

    int tmp;
    for (SLONG i = 0; i < max; i++)
    {
        tmp = *src;
        tmp = Clamp(tmp, -32767, 32767);

        *dst = tmp;

        dst++;
        src++;
    }
}


// normalize mixer buffer
void NormalizeMixerBuffer(const FLOAT fNormStrength, const SLONG slBytes, FLOAT& fLastNormValue)
{
    // just convert to 16-bit if normalization isn't required
    ASSERT(slBytes % 4 == 0);
    if (slBytes < 8) return;
    if (fNormStrength < 0.01f) {
        ConvertMixerBuffer(slBytes);
        return;
    }

    // well, I guess we'll might need to normalize a bit, so first - find maximum
    INDEX i;
    SLONG slPeak = 0;
    SLONG* pslSrc = (SLONG*)pvMixerBuffer;
    const INDEX iSamples = slBytes / 2; // 16-bit was assumed -> samples (treat as mono)
    for (i = 0; i < iSamples; i++) slPeak = Max(Abs(pslSrc[i]), slPeak);

    // determine normalize value and skip normalization if maximize is required (do not increase volume!)
    FLOAT fNormValue = 32767.0f / (FLOAT)slPeak;
    if (fNormValue > 0.99f && fLastNormValue > 0.99f) { // should be enough to tolerate
        fLastNormValue = 1.0f;
        ConvertMixerBuffer(slBytes);
        return;
    }

    // adjust normalize value by strength
    ASSERT(fNormStrength >= 0 && fNormStrength <= 1);
    fNormValue = Lerp(1.0f, fNormValue, fNormStrength);
    const FLOAT fNormAdd = (fNormValue - fLastNormValue) / (iSamples / 4);

    // normalize (and convert to 16-bit)
    SWORD* pswDst = (SWORD*)pvMixerBuffer;
    FLOAT fCurrentNormValue = fLastNormValue;
    for (i = 0; i < iSamples; i++) {
        SLONG slSample = FloatToInt(pslSrc[i] * fCurrentNormValue);
        pswDst[i] = (SWORD)Clamp(slSample, -32767L, +32767L);
        fCurrentNormValue = fCurrentNormValue + fNormAdd; // interpolate normalizer
        if (fCurrentNormValue < fNormValue && fNormAdd < 0) fCurrentNormValue = fNormValue; // clamp interpolated value
        else if (fCurrentNormValue > fNormValue && fNormAdd > 0) fCurrentNormValue = fNormValue;
    }
    // CPrintF( "%.5f -> %.5f (%.5f) @ %.9f / %d\n", fLastNormValue, fCurrentNormValue, fNormValue, fNormAdd, iSamples);
    // remember normalization value
    fLastNormValue = fCurrentNormValue;
}



// mixes one mono 16-bit signed sound to destination buffer
inline void MixMono(CSoundObject* pso)
{
    _pfSoundProfile.StartTimer(CSoundProfile::PTI_RAWMIXER);
    // Initialize some local vars
    SLONG slLeftSample, slRightSample, slNextSample;
    SLONG* pslDstBuffer = (SLONG*)pvMixerBuffer;
    fixLeftOfs = (__int64)(fLeftOfs * 65536.0f);
    fixRightOfs = (__int64)(fRightOfs * 65536.0f);
    __int64 fixLeftStep = (__int64)(fLeftStep * 65536.0f);
    __int64 fixRightStep = (__int64)(fRightStep * 65536.0f);
    __int64 fixSoundBufferSize = ((__int64)slSoundBufferSize) << 16;
    mmSurroundFactor = (__int64)(SWORD)mmSurroundFactor;

    SLONG slLeftVolTmp = slLeftVolume >> 16;
    SLONG slRightVolTmp = slRightVolume >> 16;

    // Loop through source buffer
    INDEX iCt = slMixerBufferSize;
    FOREVER
    {
        // If left channel source sample came to end of sample buffer
        if (fixLeftOfs >= fixSoundBufferSize) {
          fixLeftOfs -= fixSoundBufferSize;
          // If has no loop, end it
          bEndOfSound = bNotLoop;
        }

    // If right channel source sample came to end of sample buffer
    if (fixRightOfs >= fixSoundBufferSize) {
      fixRightOfs -= fixSoundBufferSize;
      // If has no loop, end it
      bEndOfSound = bNotLoop;
    }

    // End of buffer
    if (iCt <= 0 || bEndOfSound) break;

    // Fetch one lineary interpolated sample on left channel
    slLeftSample = pswSrcBuffer[(fixLeftOfs >> 16) + 0];
    slNextSample = pswSrcBuffer[(fixLeftOfs >> 16) + 1];
    slLeftSample = (slLeftSample * (0xFFFF - (fixLeftOfs & 0xFFFF)) + slNextSample * (fixLeftOfs & 0xFFFF)) >> 16;

    // Fetch one lineary interpolated sample on right channel
    slRightSample = pswSrcBuffer[(fixRightOfs >> 16) + 0];
    slNextSample = pswSrcBuffer[(fixRightOfs >> 16) + 1];
    slRightSample = (slRightSample * (0xFFFF - (fixRightOfs & 0xFFFF)) + slNextSample * (fixRightOfs & 0xFFFF)) >> 16;

    // Filter samples
    slLastLeftSample += ((slLeftSample - slLastLeftSample) * slLeftFilter) >> 15;
    slLastRightSample += ((slRightSample - slLastRightSample) * slRightFilter) >> 15;

    // Apply stereo volume to current sample
    slLeftSample = (slLastLeftSample * slLeftVolTmp) >> 15;
    slRightSample = (slLastRightSample * slRightVolTmp) >> 15;

    slLeftSample ^= (SLONG)((mmSurroundFactor >> 0) & 0xFFFFFFFF);
    slRightSample ^= (SLONG)((mmSurroundFactor >> 32) & 0xFFFFFFFF);

    // Mix in current sample
    slLeftSample += pslDstBuffer[0];
    slRightSample += pslDstBuffer[1];

    // [Cecil] Faster clamping
    slLeftSample = Clamp(slLeftSample, (SLONG)MIN_SWORD, (SLONG)MAX_SWORD);
    slRightSample = Clamp(slRightSample, (SLONG)MIN_SWORD, (SLONG)MAX_SWORD);

    // Store samples (both channels)
    pslDstBuffer[0] = slLeftSample;
    pslDstBuffer[1] = slRightSample;

    // Modify volume
    slLeftVolume += (SWORD)((mmVolumeGain >> 0) & 0xFFFF);
    slRightVolume += (SWORD)((mmVolumeGain >> 16) & 0xFFFF);

    // Advance to the next sample
    fixLeftOfs += fixLeftStep;
    fixRightOfs += fixRightStep;
    pslDstBuffer += 2;
    iCt--;
    }

    _pfSoundProfile.StopTimer(CSoundProfile::PTI_RAWMIXER);
}


// mixes one stereo 16-bit signed sound to destination buffer
inline void MixStereo(CSoundObject* pso)
{
    _pfSoundProfile.StartTimer(CSoundProfile::PTI_RAWMIXER);

    // Initialize some local vars
    SLONG slLeftSample, slRightSample;
    SLONG slNextLeftSample, slNextRightSample; // [Cecil]
    SLONG* pslDstBuffer = (SLONG*)pvMixerBuffer;
    fixLeftOfs = (__int64)(fLeftOfs * 65536.0f);
    fixRightOfs = (__int64)(fRightOfs * 65536.0f);
    __int64 fixLeftStep = (__int64)(fLeftStep * 65536.0f);
    __int64 fixRightStep = (__int64)(fRightStep * 65536.0f);
    __int64 fixSoundBufferSize = ((__int64)slSoundBufferSize) << 16;
    mmSurroundFactor = (__int64)(SWORD)mmSurroundFactor;

    SLONG slLeftVolTmp = slLeftVolume >> 16;
    SLONG slRightVolTmp = slRightVolume >> 16;

    // Loop through source buffer
    INDEX iCt = slMixerBufferSize;
    FOREVER
    {
        // If left channel source sample came to end of sample buffer
        if (fixLeftOfs >= fixSoundBufferSize) {
          fixLeftOfs -= fixSoundBufferSize;
          // If has no loop, end it
          bEndOfSound = bNotLoop;
        }

    // If right channel source sample came to end of sample buffer
    if (fixRightOfs >= fixSoundBufferSize) {
      fixRightOfs -= fixSoundBufferSize;
      // If has no loop, end it
      bEndOfSound = bNotLoop;
    }

    // End of buffer
    if (iCt <= 0 || bEndOfSound) break;

    // [Cecil] These nullify the lowest bit and fix distortion during doppler
    const __int64 fixLeftShift = (fixLeftOfs >> 16) << 1;
    const __int64 fixRightShift = (fixRightOfs >> 16) << 1;

    // Fetch one lineary interpolated sample on left channel
    slLeftSample = pswSrcBuffer[fixLeftShift + 0];
    slNextLeftSample = pswSrcBuffer[fixLeftShift + 2];

    // Fetch one lineary interpolated sample on right channel
    slRightSample = pswSrcBuffer[fixRightShift + 1];
    slNextRightSample = pswSrcBuffer[fixRightShift + 3];

    // [Cecil] Shortcuts
    const SWORD swLOffset = fixLeftOfs & 0xFFFF;
    const SWORD swROffset = fixRightOfs & 0xFFFF;

    slLeftSample = (slLeftSample * (0xFFFF - swLOffset) + slNextLeftSample * swLOffset) >> 16;
    slRightSample = (slRightSample * (0xFFFF - swROffset) + slNextRightSample * swROffset) >> 16;

    // Filter samples
    slLastLeftSample += ((slLeftSample - slLastLeftSample) * slLeftFilter) >> 15;
    slLastRightSample += ((slRightSample - slLastRightSample) * slRightFilter) >> 15;

    // Apply stereo volume to current sample
    slLeftSample = (slLastLeftSample * slLeftVolTmp) >> 15;
    slRightSample = (slLastRightSample * slRightVolTmp) >> 15;

    slLeftSample ^= (SLONG)((mmSurroundFactor >> 0) & 0xFFFFFFFF);
    slRightSample ^= (SLONG)((mmSurroundFactor >> 32) & 0xFFFFFFFF);

    // Mix in current sample
    slLeftSample += pslDstBuffer[0];
    slRightSample += pslDstBuffer[1];

    // [Cecil] Faster clamping
    slLeftSample = Clamp(slLeftSample, (SLONG)MIN_SWORD, (SLONG)MAX_SWORD);
    slRightSample = Clamp(slRightSample, (SLONG)MIN_SWORD, (SLONG)MAX_SWORD);

    // Store samples (both channels)
    pslDstBuffer[0] = slLeftSample;
    pslDstBuffer[1] = slRightSample;

    // Modify volume
    slLeftVolume += (SWORD)((mmVolumeGain >> 0) & 0xFFFF);
    slRightVolume += (SWORD)((mmVolumeGain >> 16) & 0xFFFF);

    // Advance to the next sample
    fixLeftOfs += fixLeftStep;
    fixRightOfs += fixRightStep;
    pslDstBuffer += 2;
    iCt--;
    }

    _pfSoundProfile.StopTimer(CSoundProfile::PTI_RAWMIXER);
}


// mixes one sound to destination buffer
void MixSound(CSoundObject* pso)
{
    psd = pso->so_pCsdLink;

    // if don't mix encoded sounds if they are not opened properly
    if ((psd->sd_ulFlags & SDF_ENCODED) &&
        (pso->so_psdcDecoder == NULL || !pso->so_psdcDecoder->IsOpen())) {
        return;
    }

    // check for supported sound formats
    const SLONG slChannels = pso->so_pCsdLink->sd_wfeFormat.nChannels;
    const SLONG slBytes = pso->so_pCsdLink->sd_wfeFormat.wBitsPerSample / 8;
    // unsupported sound formats will be ignored
    if ((slChannels != 1 && slChannels != 2) || slBytes != 2) return;

    // check for delay
    const FLOAT f1oMixerBufferSampleRate = 1.0f / slMixerBufferSampleRate;
    const FLOAT fSecondsToMix = (FLOAT)slMixerBufferSize * f1oMixerBufferSampleRate;
    pso->so_fDelayed += fSecondsToMix;
    if (pso->so_fDelayed < pso->so_sp.sp_fDelay) {
        _pfSoundProfile.IncrementCounter(CSoundProfile::PCI_SOUNDSDELAYED, 1);
        return;
    }
    // playing started, so skip further delays
    pso->so_fDelayed = 9999.9999f;

    // reach sound data and determine sound step, sound buffer and buffer size
    pswSrcBuffer = psd->sd_pswBuffer;
    fSoundSampleRate = psd->sd_wfeFormat.nSamplesPerSec * pso->so_sp.sp_fPitchShift;
    fStep = fSoundSampleRate * f1oMixerBufferSampleRate;
    fLeftStep = fStep;
    fRightStep = fStep;
    slSoundBufferSize = psd->sd_slBufferSampleSize;
    // eliminate potentional "puck" at the of sample that hasn't loop
    if (!(pso->so_slFlags & SOF_LOOP) && slSoundBufferSize > 1) slSoundBufferSize--;

    // get old and new volumes
    FLOAT fLeftVolume = ClampDn(pso->so_fLastLeftVolume, 0.0f);
    FLOAT fRightVolume = ClampDn(pso->so_fLastRightVolume, 0.0f);
    FLOAT fNewLeftVolume = ClampDn(pso->so_sp.sp_fLeftVolume, 0.0f);
    FLOAT fNewRightVolume = ClampDn(pso->so_sp.sp_fRightVolume, 0.0f);

    // adjust for master volume
    if (pso->so_slFlags & SOF_MUSIC) {
        fNewLeftVolume *= snd_fMusicVolume;
        fNewRightVolume *= snd_fMusicVolume;
    }
	else if(pso->so_slFlags & SOF_VOICE) {
        fNewLeftVolume *= snd_fVoiceVolume;
        fNewRightVolume *= snd_fVoiceVolume;
    }
    else {
        fNewLeftVolume *= snd_fSoundVolume;
        fNewRightVolume *= snd_fSoundVolume;
    }

    fNewLeftVolume *= snd_fMasterVolume;
    fNewRightVolume *= snd_fMasterVolume;

    // if both channel volumes are too low
    if (fLeftVolume < 0.001f && fRightVolume < 0.001f && fNewLeftVolume < 0.001f && fNewRightVolume < 0.001f)
    {
        // if this is not an encoded sound
        if (!(psd->sd_ulFlags & SDF_ENCODED)) {
            // skip mixing of this sample segment
            fOfsDelta = fStep * slMixerBufferSampleRate * fSecondsToMix;
            pso->so_fLeftOffset += fOfsDelta;
            pso->so_fRightOffset += fOfsDelta;
            const FLOAT fMinOfs = Min(pso->so_fLeftOffset, pso->so_fRightOffset);
            ASSERT(fMinOfs >= 0);
            if (fMinOfs < 0) CPrintF("BUG: negative offset (%.2g) encountered in sound: '%s' !\n", fMinOfs, (CTString&)psd->GetName());
            // if looping
            if (pso->so_slFlags & SOF_LOOP) {
                // adjust offset ptrs inside sound
                while (pso->so_fLeftOffset < 0) pso->so_fLeftOffset += slSoundBufferSize;
                while (pso->so_fRightOffset < 0) pso->so_fRightOffset += slSoundBufferSize;
                while (pso->so_fLeftOffset >= slSoundBufferSize) pso->so_fLeftOffset -= slSoundBufferSize;
                while (pso->so_fRightOffset >= slSoundBufferSize) pso->so_fRightOffset -= slSoundBufferSize;
                // if not looping
            }
            else {
                // no more playing
                pso->so_slFlags &= ~SOF_PLAY;
                pso->so_fDelayed = 0.0f;
                pso->so_sp.sp_fDelay = 0.0f;
            }
        }
        // reset last samples
        pso->so_swLastLeftSample = 0;
        pso->so_swLastRightSample = 0;
        // update volume
        pso->so_fLastLeftVolume = fNewLeftVolume;
        pso->so_fLastRightVolume = fNewRightVolume;

        _pfSoundProfile.IncrementCounter(CSoundProfile::PCI_SOUNDSSKIPPED, 1);
        return;
    }
    _sfStats.IncrementCounter(CStatForm::SCI_SOUNDSMIXING);

    // cache sound object vars
    fPhase = pso->so_sp.sp_fPhaseShift;
    fLeftOfs = pso->so_fLeftOffset;
    fRightOfs = pso->so_fRightOffset;
    fOfsDelta = pso->so_fOffsetDelta;
    slLeftVolume = FloatToInt(fLeftVolume * 65536 * 32767.0f);
    slRightVolume = FloatToInt(fRightVolume * 65536 * 32767.0f);
    const FLOAT fMixBufSize = 65536 * 32767.0f / slMixerBufferSize;
    const SLONG slLeftGain = FloatToInt((fNewLeftVolume - fLeftVolume) * fMixBufSize);
    const SLONG slRightGain = FloatToInt((fNewRightVolume - fRightVolume) * fMixBufSize);
    mmVolumeGain = ((__int64)(slRightGain) << 32) | ((__int64)(slLeftGain) & 0xFFFFFFFF);
    // extrapolate back new volumes because of not enough precision in interpolation!
    // (otherwise we might hear occasional pucks)
    if (fNewLeftVolume > 0.001f) fNewLeftVolume = (slLeftVolume + slLeftGain * slMixerBufferSize) / (65536 * 32767.0f);
    if (fNewRightVolume > 0.001f) fNewRightVolume = (slRightVolume + slRightGain * slMixerBufferSize) / (65536 * 32767.0f);
    //ASSERT( fNewLeftVolume>=0 && fNewRightVolume>=0);
    //CPrintF( "NV: %.4f / %.4f, GV: %.4f / %.4f\n", fNewLeftVolume,fNewRightVolume, fLeftGainedVolume,fRightGainedVolume); 

    // determine filtering and surround 
    slLeftFilter = pso->so_sp.sp_slLeftFilter;
    slRightFilter = pso->so_sp.sp_slRightFilter;
    bNotLoop = !(pso->so_slFlags & SOF_LOOP);
    mmSurroundFactor = 0;
    if (pso->so_slFlags & SOF_SURROUND) mmSurroundFactor = 0x0000FFFF;

    // if this is an encoded sound
    BOOL bDecodingFinished = FALSE;
    if (psd->sd_ulFlags & SDF_ENCODED) {
        _pfSoundProfile.StartTimer(CSoundProfile::PTI_DECODESOUND);
        // decode some samples from it
        SLONG slWantedBytes = FloatToInt(slMixerBufferSize * fStep * pso->so_pCsdLink->sd_wfeFormat.nChannels) * 2;
        void* pvDecodeBuffer = _pSound->sl_pswDecodeBuffer;
        ASSERT(slWantedBytes <= _pSound->sl_slDecodeBufferSize);
        SLONG slDecodedBytes = pso->so_psdcDecoder->Decode(pvDecodeBuffer, slWantedBytes);
        ASSERT(slDecodedBytes <= slWantedBytes);
        // if it has a loop
        if (!bNotLoop) {
            // if sound is shorter than buffer
            while (slDecodedBytes < slWantedBytes) {
                // decode it again and again
                pso->so_psdcDecoder->Reset();
                slDecodedBytes += pso->so_psdcDecoder->Decode(((UBYTE*)pvDecodeBuffer) +
                    slDecodedBytes, slWantedBytes - slDecodedBytes);
            }
            // if it doesn't have a loop
        }
        else {
            // if sound is shorter than buffer
            if (slDecodedBytes < slWantedBytes) {
                // mark that it is finished
                bDecodingFinished = TRUE;
            }
        }
        // copy first sample to the last one (this is needed for linear interpolation)
        (ULONG&)(((UBYTE*)pvDecodeBuffer)[slDecodedBytes]) = *(ULONG*)pvDecodeBuffer;
        // fix some mixer variables to play temporary decode buffer instead of real sound
        pswSrcBuffer = (SWORD*)pvDecodeBuffer;
        slSoundBufferSize = slDecodedBytes >> 2;  // convert to samples
        fLeftOfs = 0.0f;
        fRightOfs = 0.0f;
        fPhase = 0.0f;

        _pfSoundProfile.StopTimer(CSoundProfile::PTI_DECODESOUND);
    }

    _pfSoundProfile.IncrementCounter(CSoundProfile::PCI_SOUNDSMIXED, 1);
    _pfSoundProfile.IncrementCounter(CSoundProfile::PCI_SAMPLES, slMixerBufferSize);

    _pfSoundProfile.StartTimer(CSoundProfile::PTI_MIXSOUND);

    slLastLeftSample = pso->so_swLastLeftSample;
    slLastRightSample = pso->so_swLastRightSample;

    // calculate eventual new offsets from phase shift
    FLOAT fLastPhase = fOfsDelta / fSoundSampleRate;
    FLOAT fPhaseDelta = fPhase - fLastPhase;
    FLOAT fStepDelta = Abs(fPhaseDelta * fSoundSampleRate / slMixerBufferSize);

    FLOAT fStepDeltaL, fStepDeltaR;
    if (fPhaseDelta > 0) {
        fStepDeltaL = fStepDelta / 2;
        if (fStepDeltaL > fLeftStep / 2) fStepDeltaL = fLeftStep / 2;
        fStepDeltaL = -fStepDeltaL;
        fStepDeltaR = fStepDelta + fStepDeltaL;
    }
    else {
        fStepDeltaR = fStepDelta / 2;
        if (fStepDeltaR > fLeftStep / 2) fStepDeltaR = fLeftStep / 2;
        fStepDeltaR = -fStepDeltaR;
        fStepDeltaL = fStepDelta + fStepDeltaR;
    }
    fLeftStep += fStepDeltaL;
    fRightStep += fStepDeltaR;
    fStepDelta = fStepDeltaR - fStepDeltaL;

    // if there is anything to mix (could be nothing when encoded file just finished)
    if (slSoundBufferSize > 0) {
        // safety check (needed because of bad-bug!)
        FLOAT fMinOfs = Min(fLeftOfs, fRightOfs);
        ASSERT(fMinOfs >= 0);
        if (fMinOfs < 0) CPrintF("BUG: negative offset (%.2g) encountered in sound: '%s' !\n", fMinOfs, (CTString&)psd->GetName());
        // adjust offset ptrs inside sound to match those of phase shift
        while (fLeftOfs < 0) fLeftOfs += slSoundBufferSize;
        while (fRightOfs < 0) fRightOfs += slSoundBufferSize;
        while (fLeftOfs >= slSoundBufferSize) fLeftOfs -= slSoundBufferSize;
        while (fRightOfs >= slSoundBufferSize) fRightOfs -= slSoundBufferSize;

        // if mono output is required
        if (snd_bMono) {
            // monomize channels (cool word:)
            fLeftOfs = (fLeftOfs + fRightOfs) / 2;
            fRightOfs = fLeftOfs;
            fLeftStep = (fLeftStep + fRightStep) / 2;
            fRightStep = fLeftStep;
            slLeftVolume = (slLeftVolume + slRightVolume) / 2;
            slRightVolume = slLeftVolume;
            slLeftFilter = (slLeftFilter + slRightFilter) / 2;
            slRightFilter = slLeftFilter;
        }

        // call corresponding mixer routine for current sound format
        bEndOfSound = FALSE;
        if (slChannels == 2) {
            // mix as 16-bit stereo
            MixStereo(pso);
        }
        else {
            // mix as 16-bit mono
            MixMono(pso);
        }
    }

    // if encoded sound
    if (psd->sd_ulFlags & SDF_ENCODED) {
        // ignore mixing finished flag, but use decoding finished flag
        bEndOfSound = bDecodingFinished;
    }

    // if sound ended, not buffer
    if (bEndOfSound) {
        // reset some sound vars
        slLastLeftSample = 0;
        slLastRightSample = 0;
        pso->so_slFlags &= ~SOF_PLAY;
        pso->so_fDelayed = 0.0f;
        pso->so_sp.sp_fDelay = 0.0f;
    }

    // rememer last samples for the next mix in
    pso->so_swLastLeftSample = (SWORD)slLastLeftSample;
    pso->so_swLastRightSample = (SWORD)slLastRightSample;
    // determine new phase shift offset
    pso->so_fOffsetDelta += fStepDelta * slMixerBufferSize;
    // update play offset for the next mix iteration
    pso->so_fLeftOffset = fixLeftOfs * (1.0f / 65536.0f);
    pso->so_fRightOffset = fixRightOfs * (1.0f / 65536.0f);
    // update volume
    pso->so_fLastLeftVolume = fNewLeftVolume;
    pso->so_fLastRightVolume = fNewRightVolume;

    //if( pso->so_fLastLeftVolume>0 || pso->so_fLastRightVolume>0 || fNewLeftVolume>0 || fNewRightVolume>0) {
    //  CPrintF( "SO: 0x%8X; OV: %.4f / %.4f, NV: %.4f / %.4f\n", pso,
    //            pso->so_fLastLeftVolume,pso->so_fLastRightVolume, fNewLeftVolume,fNewRightVolume);
    //}
    _pfSoundProfile.StopTimer(CSoundProfile::PTI_MIXSOUND);
}

