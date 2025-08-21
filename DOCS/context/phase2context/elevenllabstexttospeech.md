---
title: Text to Speech
subtitle: Learn how to turn text into lifelike spoken audio with ElevenLabs.
---

## Overview

ElevenLabs [Text to Speech (TTS)](/docs/api-reference/text-to-speech) API turns text into lifelike audio with nuanced intonation, pacing and emotional awareness. [Our models](/docs/models) adapt to textual cues across 32 languages and multiple voice styles and can be used to:

- Narrate global media campaigns & ads
- Produce audiobooks in multiple languages with complex emotional delivery
- Stream real-time audio from text

Listen to a sample:

<elevenlabs-audio-player
    audio-title="George"
    audio-src="https://storage.googleapis.com/eleven-public-cdn/audio/marketing/george.mp3"
/>

Explore our [voice library](https://elevenlabs.io/community) to find the perfect voice for your project.

<CardGroup cols={2}>
  <Card title="Developer quickstart" icon="duotone book-sparkles" href="/docs/quickstart">
    Learn how to integrate text to speech into your application.
  </Card>
  <Card
    title="Product guide"
    icon="duotone book-user"
    href="/docs/product-guides/playground/text-to-speech"
  >
    Step-by-step guide for using text to speech in ElevenLabs.
  </Card>
</CardGroup>

### Voice quality

For real-time applications, Flash v2.5 provides ultra-low 75ms latency, while Multilingual v2 delivers the highest quality audio with more nuanced expression.

<CardGroup cols={2} rows={2}>
  <Card title={<div className="flex items-start gap-2"><div>Eleven v3</div><div><img src="file:e79c5f8f-a5cf-48bd-afe5-bf0058a645e7" alt="Alpha" /></div></div>} href="/docs/models#eleven-v3-alpha">
    Our most emotionally rich, expressive speech synthesis model
    <div className="mt-4 space-y-2">
      <div className="text-sm">Dramatic delivery and performance</div>
      <div className="text-sm">70+ languages supported</div>
      <div className="text-sm">10,000 character limit</div>
      <div className="text-sm">Support for natural multi-speaker dialogue</div>
    </div>
  </Card>
  <Card title="Eleven Multilingual v2" href="/docs/models#multilingual-v2">
    Lifelike, consistent quality speech synthesis model
    <div className="mt-4 space-y-2">
      <div className="text-sm">Natural-sounding output</div>
      <div className="text-sm">29 languages supported</div>
      <div className="text-sm">10,000 character limit</div>
      <div className="text-sm">Most stable on long-form generations</div>
    </div>
  </Card>
  <Card title="Eleven Flash v2.5" href="/docs/models#flash-v25">
    Our fast, affordable speech synthesis model
    <div className="mt-4 space-y-2">
      <div className="text-sm">Ultra-low latency (~75ms&dagger;)</div>
      <div className="text-sm">32 languages supported</div>
      <div className="text-sm">40,000 character limit</div>
      <div className="text-sm">Faster model, 50% lower price per character</div>
    </div>
  </Card>
  <Card title="Eleven Turbo v2.5" href="/docs/models#turbo-v25">
    High quality, low-latency model with a good balance of quality and speed
    <div className="mt-4 space-y-2">
      <div className="text-sm">High quality voice generation</div>
      <div className="text-sm">32 languages supported</div>
      <div className="text-sm">40,000 character limit</div>
      <div className="text-sm">Low latency (~250ms-300ms&dagger;), 50% lower price per character</div>

    </div>

  </Card>
</CardGroup>


<div className="text-center">
  <div>[Explore all](/docs/models)</div>
</div>

### Voice options

ElevenLabs offers thousands of voices across 32 languages through multiple creation methods:

- [Voice library](/docs/capabilities/voices) with 3,000+ community-shared voices
- [Professional voice cloning](/docs/capabilities/voices#cloned) for highest-fidelity replicas
- [Instant voice cloning](/docs/capabilities/voices#cloned) for quick voice replication
- [Voice design](/docs/capabilities/voices#voice-design) to generate custom voices from text descriptions

Learn more about our [voice options](/docs/capabilities/voices).

### Supported formats

The default response format is "mp3", but other formats like "PCM", & "μ-law" are available.

- **MP3**
  - Sample rates: 22.05kHz - 44.1kHz
  - Bitrates: 32kbps - 192kbps
  - 22.05kHz @ 32kbps
  - 44.1kHz @ 32kbps, 64kbps, 96kbps, 128kbps, 192kbps
- **PCM (S16LE)**
  - Sample rates: 16kHz - 44.1kHz
  - Bitrates: 8kHz, 16kHz, 22.05kHz, 24kHz, 44.1kHz, 48kHz
  - 16-bit depth
- **μ-law**
  - 8kHz sample rate
  - Optimized for telephony applications
- **A-law**
  - 8kHz sample rate
  - Optimized for telephony applications
- **Opus**
  - Sample rate: 48kHz
  - Bitrates: 32kbps - 192kbps

<Success>
  Higher quality audio options are only available on paid tiers - see our [pricing
  page](https://elevenlabs.io/pricing/api) for details.
</Success>

### Supported languages

Our multilingual v2 models support 29 languages:

_English (USA, UK, Australia, Canada), Japanese, Chinese, German, Hindi, French (France, Canada), Korean, Portuguese (Brazil, Portugal), Italian, Spanish (Spain, Mexico), Indonesian, Dutch, Turkish, Filipino, Polish, Swedish, Bulgarian, Romanian, Arabic (Saudi Arabia, UAE), Czech, Greek, Finnish, Croatian, Malay, Slovak, Danish, Tamil, Ukrainian & Russian._


Flash v2.5 supports 32 languages - all languages from v2 models plus:

_Hungarian, Norwegian & Vietnamese_


Simply input text in any of our supported languages and select a matching voice from our [voice library](https://elevenlabs.io/community). For the most natural results, choose a voice with an accent that matches your target language and region.

### Prompting

The models interpret emotional context directly from the text input. For example, adding
descriptive text like "she said excitedly" or using exclamation marks will influence the speech
emotion. Voice settings like Stability and Similarity help control the consistency, while the
underlying emotion comes from textual cues.

Read the [prompting guide](/docs/best-practices/prompting) for more details.

<Note>
  Descriptive text will be spoken out by the model and must be manually trimmed or removed from the
  audio if desired.
</Note>

## FAQ

<AccordionGroup>
  <Accordion title="Can I clone my own voice?">
    Yes, you can create [instant voice clones](/docs/capabilities/voices#cloned) of your own voice
    from short audio clips. For high-fidelity clones, check out our [professional voice
    cloning](/docs/capabilities/voices#cloned) feature.
  </Accordion>
  <Accordion title="Do I own the audio output?">
    Yes. You retain ownership of any audio you generate. However, commercial usage rights are only
    available with paid plans. With a paid subscription, you may use generated audio for commercial
    purposes and monetize the outputs if you own the IP rights to the input content.
  </Accordion>
  <Accordion title="What qualifies as a free regeneration?">
    A free regeneration allows you to regenerate the same text to speech content without additional cost, subject to these conditions:

    - You can regenerate each piece of content up to 2 times for free
    - The content must be exactly the same as the previous generation. Any changes to the text, voice settings, or other parameters will require a new, paid generation

    Free regenerations are useful in case there is a slight distortion in the audio output. According to ElevenLabs' internal benchmarks, regenerations will solve roughly half of issues with quality, with remaining issues usually due to poor training data.

  </Accordion>
  <Accordion title="How do I reduce latency for real-time cases?">
    Use the low-latency Flash [models](/docs/models) (Flash v2 or v2.5) optimized for near real-time
    conversational or interactive scenarios. See our [latency optimization
    guide](/docs/best-practices/latency-optimization) for more details.
  </Accordion>
  <Accordion title="Why is my output sometimes inconsistent?">
    The models are nondeterministic. For consistency, use the optional [seed
    parameter](/docs/api-reference/text-to-speech/convert#request.body.seed), though subtle
    differences may still occur.
  </Accordion>
  <Accordion title="What's the best practice for large text conversions?">
    Split long text into segments and use streaming for real-time playback and efficient processing.
    To maintain natural prosody flow between chunks, include [previous/next text or previous/next
    request id parameters](/docs/api-reference/text-to-speech/convert#request.body.previous_text).
  </Accordion>
</AccordionGroup>
