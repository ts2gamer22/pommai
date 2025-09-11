================================================
FILE: README.md
================================================
pylibopus
===========

Python bindings to the libopus, IETF low-delay audio codec.

**This fork also implements the Opus multichannel encoder and decoder.**


Testing
--------

Run tests with a python setup.py test command.


Contributing
-------------

If you want to contribute, follow the [pep8](http://www.python.org/dev/peps/pep-0008/) guideline, and include the tests.



================================================
FILE: LICENSE
================================================
Copyright (c) 2012, SvartalF
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the SvartalF nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


================================================
FILE: Makefile
================================================
# Makefile for pylibopus.
#
# Author:: Никита Кузнецов <self@svartalf.info>
# Copyright:: Copyright (c) 2012, SvartalF
# License:: BSD 3-Clause License
#


.DEFAULT_GOAL := all


all: develop

develop:
	python setup.py develop

install:
	python setup.py install

install_requirements_test:
	pip install -r requirements_test.txt

uninstall:
	pip uninstall -y pylibopus

reinstall: uninstall develop

remember_test:
	@echo
	@echo "Hello from the Makefile..."
	@echo "Don't forget to run: 'make install_requirements_test'"
	@echo

clean:
	rm -rf *.egg* build dist *.py[oc] */*.py[co] cover doctest_pypi.cfg \
		nosetests.xml pylint.log *.egg output.xml flake8.log tests.log \
		test-result.xml htmlcov fab.log *.deb .coverage

publish:
	python setup.py sdist
	twine upload dist/*

nosetests: remember_test
	python setup.py nosetests

flake8: pep8

pep8: remember_test
	flake8 --ignore=E402,E731 --max-complexity 12 --exit-zero pylibopus/*.py \
	pylibopus/api/*.py tests/*.py

pylint: lint

lint: remember_test
	pylint --msg-template="{path}:{line}: [{msg_id}({symbol}), {obj}] {msg}" \
	-r n pylibopus/*.py pylibopus/api/*.py tests/*.py || exit 0

test: lint pep8 mypy nosetests

mypy:
	mypy --strict .

docker_build:
	docker build .

checkmetadata:
	python setup.py check -s --metadata --restructuredtext



================================================
FILE: requirements_test.txt
================================================
# Python Distribution Package Requirements for OpusLib.
#

flake8
pylint
twine
mypy



================================================
FILE: setup.cfg
================================================
# Nosetests configuration for Python OpusLib.

[nosetests]
with-xunit = 1
with-coverage = 1
cover-html = 1
with-doctest = 1
doctest-tests = 1
cover-tests = 0
cover-package = opuslib



================================================
FILE: setup.py
================================================
#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""Python libopus Package."""

import setuptools  # type: ignore

setuptools.setup(
    name='pylibopus',
    version='3.0.5',
    author='Никита Кузнецов',
    author_email='self@svartalf.info',
    maintainer='Chris Hold',
    maintainer_email='info@chrisholdaudio.com',
    license='BSD 3-Clause License',
    url='https://github.com/chris-hld/pylibopus',
    description='Python bindings to the libopus, IETF low-delay audio codec',
    packages=('pylibopus', 'pylibopus.api'),
    test_suite='tests',
    zip_safe=False,
    tests_require=[
        'coverage >= 4.4.1',
        'nose >= 1.3.7',
    ],
    classifiers=(
        'Development Status :: 1 - Planning',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: BSD License',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Programming Language :: Python :: 3.6',
        'Topic :: Software Development :: Libraries',
        'Topic :: Multimedia :: Sound/Audio :: Conversion',
    ),
)



================================================
FILE: .travis.yml
================================================
language: python

python:
    - '3.6'
    - 'pypy3'

# Compile C library
before_install:
    - 'pushd .'
    - 'git clone -b v1.0.1 --depth 1 git://git.xiph.org/opus.git /tmp/opus'
    - 'cd /tmp/opus && ./autogen.sh && ./configure'
    - 'cd /tmp/opus && make && sudo make install'
    - 'popd'

# Install test dependencies
install:
    - 'sudo pip install pep8 --use-mirrors'

before_script:
    - 'pep8 --ignore=E501,E225 opus'

script:
    - 'LD_PRELOAD=/usr/local/lib/libopus.so python setup.py test'



================================================
FILE: pylibopus/__init__.py
================================================
#!/usr/bin/env python
# -*- coding: utf-8 -*-

# OpusLib Python Module.

"""
OpusLib Python Module.
~~~~~~~

Python bindings to the libopus, IETF low-delay audio codec

:author: Никита Кузнецов <self@svartalf.info>
:copyright: Copyright (c) 2012, SvartalF
:license: BSD 3-Clause License
:source: <https://github.com/onbeep/opuslib>

"""

from .exceptions import OpusError  # NOQA

from .constants import *  # NOQA

from .constants import OK, APPLICATION_TYPES_MAP  # NOQA

from .classes import Encoder, Decoder  # NOQA
from .classes import MultiStreamEncoder, MultiStreamDecoder  # NOQA
from .classes import ProjectionEncoder, ProjectionDecoder  # NOQA


__author__ = 'Никита Кузнецов <self@svartalf.info>'
__copyright__ = 'Copyright (c) 2012, SvartalF'
__license__ = 'BSD 3-Clause License'



================================================
FILE: pylibopus/classes.py
================================================
#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""High-level interface to a Opus decoder functions"""

import typing

import pylibopus
import pylibopus.api
import pylibopus.api.ctl
import pylibopus.api.decoder
import pylibopus.api.encoder
import pylibopus.api.multistream_encoder
import pylibopus.api.multistream_decoder
import pylibopus.api.projection_encoder
import pylibopus.api.projection_decoder


__author__ = 'Никита Кузнецов <self@svartalf.info>'
__copyright__ = 'Copyright (c) 2012, SvartalF'
__license__ = 'BSD 3-Clause License'


class Encoder(object):

    """High-Level Encoder Object."""

    def __init__(self, fs, channels, application) -> None:
        """
        Parameters:
            fs : sampling rate
            channels : number of channels
        """
        # Check to see if the Encoder Application Macro is available:
        if application in list(pylibopus.APPLICATION_TYPES_MAP.keys()):
            application = pylibopus.APPLICATION_TYPES_MAP[application]
        elif application in list(pylibopus.APPLICATION_TYPES_MAP.values()):
            pass  # Nothing to do here
        else:
            raise ValueError(
                "`application` value must be in 'voip', 'audio' or "
                "'restricted_lowdelay'")

        self._fs = fs
        self._channels = channels
        self._application = application
        self.encoder_state = pylibopus.api.encoder.create_state(
            fs, channels, application)

    def __del__(self) -> None:
        if hasattr(self, 'encoder_state'):
            # Destroying state only if __init__ completed successfully
            pylibopus.api.encoder.destroy(self.encoder_state)

    def reset_state(self) -> None:
        """
        Resets the codec state to be equivalent to a freshly initialized state
        """
        pylibopus.api.encoder.encoder_ctl(
            self.encoder_state, pylibopus.api.ctl.reset_state)

    def encode(self, pcm_data: bytes, frame_size: int) -> bytes:
        """
        Encodes given PCM data as Opus.
        """
        return pylibopus.api.encoder.encode(
            self.encoder_state,
            pcm_data,
            frame_size,
            len(pcm_data)
        )

    def encode_float(self, pcm_data: bytes, frame_size: int) -> bytes:
        """
        Encodes given PCM data as Opus.
        """
        return pylibopus.api.encoder.encode_float(
            self.encoder_state,
            pcm_data,
            frame_size,
            len(pcm_data)
        )

    # CTL interfaces

    def _get_final_range(self): return pylibopus.api.encoder.encoder_ctl(
        self.encoder_state,
        pylibopus.api.ctl.get_final_range
    )

    final_range = property(_get_final_range)

    def _get_bandwidth(self): return pylibopus.api.encoder.encoder_ctl(
        self.encoder_state, pylibopus.api.ctl.get_bandwidth)

    bandwidth = property(_get_bandwidth)

    def _get_pitch(self): return pylibopus.api.encoder.encoder_ctl(
        self.encoder_state, pylibopus.api.ctl.get_pitch)

    pitch = property(_get_pitch)

    def _get_lsb_depth(self): return pylibopus.api.encoder.encoder_ctl(
        self.encoder_state, pylibopus.api.ctl.get_lsb_depth)

    def _set_lsb_depth(self, x): return pylibopus.api.encoder.encoder_ctl(
        self.encoder_state, pylibopus.api.ctl.set_lsb_depth, x)

    lsb_depth = property(_get_lsb_depth, _set_lsb_depth)

    def _get_complexity(self): return pylibopus.api.encoder.encoder_ctl(
        self.encoder_state, pylibopus.api.ctl.get_complexity)

    def _set_complexity(self, x): return pylibopus.api.encoder.encoder_ctl(
        self.encoder_state, pylibopus.api.ctl.set_complexity, x)

    complexity = property(_get_complexity, _set_complexity)

    def _get_bitrate(self): return pylibopus.api.encoder.encoder_ctl(
        self.encoder_state, pylibopus.api.ctl.get_bitrate)

    def _set_bitrate(self, x): return pylibopus.api.encoder.encoder_ctl(
        self.encoder_state, pylibopus.api.ctl.set_bitrate, x)

    bitrate = property(_get_bitrate, _set_bitrate)

    def _get_vbr(self): return pylibopus.api.encoder.encoder_ctl(
        self.encoder_state, pylibopus.api.ctl.get_vbr)

    def _set_vbr(self, x): return pylibopus.api.encoder.encoder_ctl(
        self.encoder_state, pylibopus.api.ctl.set_vbr, x)

    vbr = property(_get_vbr, _set_vbr)

    def _get_vbr_constraint(self): return pylibopus.api.encoder.encoder_ctl(
        self.encoder_state, pylibopus.api.ctl.get_vbr_constraint)

    def _set_vbr_constraint(self, x): return pylibopus.api.encoder.encoder_ctl(
        self.encoder_state, pylibopus.api.ctl.set_vbr_constraint, x)

    vbr_constraint = property(_get_vbr_constraint, _set_vbr_constraint)

    def _get_force_channels(self): return pylibopus.api.encoder.encoder_ctl(
        self.encoder_state, pylibopus.api.ctl.get_force_channels)

    def _set_force_channels(self, x): return pylibopus.api.encoder.encoder_ctl(
        self.encoder_state, pylibopus.api.ctl.set_force_channels, x)

    force_channels = property(_get_force_channels, _set_force_channels)

    def _get_max_bandwidth(self): return pylibopus.api.encoder.encoder_ctl(
        self.encoder_state, pylibopus.api.ctl.get_max_bandwidth)

    def _set_max_bandwidth(self, x): return pylibopus.api.encoder.encoder_ctl(
        self.encoder_state, pylibopus.api.ctl.set_max_bandwidth, x)

    max_bandwidth = property(_get_max_bandwidth, _set_max_bandwidth)

    def _set_bandwidth(self, x): return pylibopus.api.encoder.encoder_ctl(
        self.encoder_state, pylibopus.api.ctl.set_bandwidth, x)

    bandwidth = property(None, _set_bandwidth)

    def _get_signal(self): return pylibopus.api.encoder.encoder_ctl(
        self.encoder_state, pylibopus.api.ctl.get_signal)

    def _set_signal(self, x): return pylibopus.api.encoder.encoder_ctl(
        self.encoder_state, pylibopus.api.ctl.set_signal, x)

    signal = property(_get_signal, _set_signal)

    def _get_application(self): return pylibopus.api.encoder.encoder_ctl(
        self.encoder_state, pylibopus.api.ctl.get_application)

    def _set_application(self, x): return pylibopus.api.encoder.encoder_ctl(
        self.encoder_state, pylibopus.api.ctl.set_application, x)

    application = property(_get_application, _set_application)

    def _get_sample_rate(self): return pylibopus.api.encoder.encoder_ctl(
        self.encoder_state, pylibopus.api.ctl.get_sample_rate)

    sample_rate = property(_get_sample_rate)

    def _get_lookahead(self): return pylibopus.api.encoder.encoder_ctl(
        self.encoder_state, pylibopus.api.ctl.get_lookahead)

    lookahead = property(_get_lookahead)

    def _get_inband_fec(self): return pylibopus.api.encoder.encoder_ctl(
        self.encoder_state, pylibopus.api.ctl.get_inband_fec)

    def _set_inband_fec(self, x): return pylibopus.api.encoder.encoder_ctl(
        self.encoder_state, pylibopus.api.ctl.set_inband_fec, x)

    inband_fec = property(_get_inband_fec, _set_inband_fec)

    def _get_packet_loss_perc(self): return pylibopus.api.encoder.encoder_ctl(
        self.encoder_state, pylibopus.api.ctl.get_packet_loss_perc)

    def _set_packet_loss_perc(self, x): return pylibopus.api.encoder.encoder_ctl(
            self.encoder_state, pylibopus.api.ctl.set_packet_loss_perc, x)

    packet_loss_perc = property(_get_packet_loss_perc, _set_packet_loss_perc)

    def _get_dtx(self): return pylibopus.api.encoder.encoder_ctl(
        self.encoder_state, pylibopus.api.ctl.get_dtx)

    def _set_dtx(self, x): return pylibopus.api.encoder.encoder_ctl(
        self.encoder_state, pylibopus.api.ctl.set_dtx, x)

    dtx = property(_get_dtx, _set_dtx)


class Decoder(object):

    """High-Level Decoder Object."""

    def __init__(self, fs: int, channels: int) -> None:
        """
        :param fs: Sample Rate.
        :param channels: Number of channels.
        """
        self._fs = fs
        self._channels = channels
        self.decoder_state = pylibopus.api.decoder.create_state(fs, channels)

    def __del__(self) -> None:
        if hasattr(self, 'decoder_state'):
            # Destroying state only if __init__ completed successfully
            pylibopus.api.decoder.destroy(self.decoder_state)

    def reset_state(self) -> None:
        """
        Resets the codec state to be equivalent to a freshly initialized state
        """
        pylibopus.api.decoder.decoder_ctl(
            self.decoder_state,
            pylibopus.api.ctl.reset_state
        )

    # FIXME: Remove typing.Any once we have a stub for ctypes
    def decode(
        self,
        opus_data: bytes,
        frame_size: int,
        decode_fec: bool = False
    ) -> typing.Union[bytes, typing.Any]:
        """
        Decodes given Opus data to PCM.
        """
        return pylibopus.api.decoder.decode(
            self.decoder_state,
            opus_data,
            len(opus_data),
            frame_size,
            decode_fec,
            channels=self._channels
        )

    # FIXME: Remove typing.Any once we have a stub for ctypes
    def decode_float(
        self,
        opus_data: bytes,
        frame_size: int,
        decode_fec: bool = False
    ) -> typing.Union[bytes, typing.Any]:
        """
        Decodes given Opus data to PCM.
        """
        return pylibopus.api.decoder.decode_float(
            self.decoder_state,
            opus_data,
            len(opus_data),
            frame_size,
            decode_fec,
            channels=self._channels
        )

    # CTL interfaces

    def _get_final_range(self): return pylibopus.api.decoder.decoder_ctl(
        self.decoder_state,
        pylibopus.api.ctl.get_final_range
    )

    final_range = property(_get_final_range)

    def _get_bandwidth(self): return pylibopus.api.decoder.decoder_ctl(
        self.decoder_state,
        pylibopus.api.ctl.get_bandwidth
    )

    bandwidth = property(_get_bandwidth)

    def _get_pitch(self): return pylibopus.api.decoder.decoder_ctl(
        self.decoder_state,
        pylibopus.api.ctl.get_pitch
    )

    pitch = property(_get_pitch)

    def _get_lsb_depth(self): return pylibopus.api.decoder.decoder_ctl(
        self.decoder_state,
        pylibopus.api.ctl.get_lsb_depth
    )

    def _set_lsb_depth(self, x): return pylibopus.api.decoder.decoder_ctl(
        self.decoder_state,
        pylibopus.api.ctl.set_lsb_depth,
        x
    )

    lsb_depth = property(_get_lsb_depth, _set_lsb_depth)

    def _get_gain(self): return pylibopus.api.decoder.decoder_ctl(
        self.decoder_state,
        pylibopus.api.ctl.get_gain
    )

    def _set_gain(self, x): return pylibopus.api.decoder.decoder_ctl(
        self.decoder_state,
        pylibopus.api.ctl.set_gain,
        x
    )

    gain = property(_get_gain, _set_gain)


class MultiStreamEncoder(object):
    """High-Level MultiStreamEncoder Object."""

    def __init__(self, fs: int, channels: int, streams: int,
                 coupled_streams: int, mapping: list,
                 application: int) -> None:
        """
        Parameters:
            fs : sampling rate
            channels : number of channels
        """
        # Check to see if the Encoder Application Macro is available:
        if application in list(pylibopus.APPLICATION_TYPES_MAP.keys()):
            application = pylibopus.APPLICATION_TYPES_MAP[application]
        elif application in list(pylibopus.APPLICATION_TYPES_MAP.values()):
            pass  # Nothing to do here
        else:
            raise ValueError(
                "`application` value must be in 'voip', 'audio' or "
                "'restricted_lowdelay'")

        self._fs = fs
        self._channels = channels
        self._streams = streams
        self._coupled_streams = coupled_streams
        self._mapping = mapping
        self._application = application
        self.msencoder_state = pylibopus.api.multistream_encoder.create_state(
            self._fs, self._channels, self._streams, self._coupled_streams,
            self._mapping, self._application)

    def __del__(self) -> None:
        if hasattr(self, 'msencoder_state'):
            # Destroying state only if __init__ completed successfully
            pylibopus.api.multistream_encoder.destroy(self.msencoder_state)

    def reset_state(self) -> None:
        """
        Resets the codec state to be equivalent to a freshly initialized state
        """
        pylibopus.api.multistream_encoder.encoder_ctl(
            self.msencoder_state, pylibopus.api.ctl.reset_state)

    def encode(self, pcm_data: bytes, frame_size: int) -> bytes:
        """
        Encodes given PCM data as Opus.
        """
        return pylibopus.api.multistream_encoder.encode(
            self.msencoder_state,
            pcm_data,
            frame_size,
            len(pcm_data)
        )

    def encode_float(self, pcm_data: bytes, frame_size: int) -> bytes:
        """
        Encodes given PCM data as Opus.
        """
        return pylibopus.api.multistream_encoder.encode_float(
            self.msencoder_state,
            pcm_data,
            frame_size,
            len(pcm_data)
        )

    # CTL interfaces

    def _get_final_range(self): return \
        pylibopus.api.multistream_encoder.encoder_ctl(
        self.msencoder_state,
        pylibopus.api.ctl.get_final_range
    )

    final_range = property(_get_final_range)

    def _get_bandwidth(self): return \
        pylibopus.api.multistream_encoder.encoder_ctl(
        self.msencoder_state, pylibopus.api.ctl.get_bandwidth)

    bandwidth = property(_get_bandwidth)

    def _get_pitch(self): return \
        pylibopus.api.multistream_encoder.encoder_ctl(
        self.msencoder_state, pylibopus.api.ctl.get_pitch)

    pitch = property(_get_pitch)

    def _get_lsb_depth(self): return \
        pylibopus.api.multistream_encoder.encoder_ctl(
        self.msencoder_state, pylibopus.api.ctl.get_lsb_depth)

    def _set_lsb_depth(self, x): return \
        pylibopus.api.multistream_encoder.encoder_ctl(
        self.msencoder_state, pylibopus.api.ctl.set_lsb_depth, x)

    lsb_depth = property(_get_lsb_depth, _set_lsb_depth)

    def _get_complexity(self): return \
        pylibopus.api.multistream_encoder.encoder_ctl(
        self.msencoder_state, pylibopus.api.ctl.get_complexity)

    def _set_complexity(self, x): return \
        pylibopus.api.multistream_encoder.encoder_ctl(
        self.msencoder_state, pylibopus.api.ctl.set_complexity, x)

    complexity = property(_get_complexity, _set_complexity)

    def _get_bitrate(self): return \
        pylibopus.api.multistream_encoder.encoder_ctl(
        self.msencoder_state, pylibopus.api.ctl.get_bitrate)

    def _set_bitrate(self, x): return \
        pylibopus.api.multistream_encoder.encoder_ctl(
        self.msencoder_state, pylibopus.api.ctl.set_bitrate, x)

    bitrate = property(_get_bitrate, _set_bitrate)

    def _get_vbr(self): return \
        pylibopus.api.multistream_encoder.encoder_ctl(
        self.msencoder_state, pylibopus.api.ctl.get_vbr)

    def _set_vbr(self, x): return \
        pylibopus.api.multistream_encoder.encoder_ctl(
        self.msencoder_state, pylibopus.api.ctl.set_vbr, x)

    vbr = property(_get_vbr, _set_vbr)

    def _get_vbr_constraint(self): return \
        pylibopus.api.multistream_encoder.encoder_ctl(
        self.msencoder_state, pylibopus.api.ctl.get_vbr_constraint)

    def _set_vbr_constraint(self, x): return \
        pylibopus.api.multistream_encoder.encoder_ctl(
        self.msencoder_state, pylibopus.api.ctl.set_vbr_constraint, x)

    vbr_constraint = property(_get_vbr_constraint, _set_vbr_constraint)

    def _get_force_channels(self): return \
        pylibopus.api.multistream_encoder.encoder_ctl(
        self.msencoder_state, pylibopus.api.ctl.get_force_channels)

    def _set_force_channels(self, x): return \
        pylibopus.api.multistream_encoder.encoder_ctl(
        self.msencoder_state, pylibopus.api.ctl.set_force_channels, x)

    force_channels = property(_get_force_channels, _set_force_channels)

    def _get_max_bandwidth(self): return \
        pylibopus.api.encoder.multistream_encoder.encoder_ctl(
        self.msencoder_state, pylibopus.api.ctl.get_max_bandwidth)

    def _set_max_bandwidth(self, x): return \
        pylibopus.api.multistream_encoder.encoder_ctl(
        self.msencoder_state, pylibopus.api.ctl.set_max_bandwidth, x)

    max_bandwidth = property(_get_max_bandwidth, _set_max_bandwidth)

    def _set_bandwidth(self, x): return \
        pylibopus.api.multistream_encoder.encoder_ctl(
        self.msencoder_state, pylibopus.api.ctl.set_bandwidth, x)

    bandwidth = property(None, _set_bandwidth)

    def _get_signal(self): return \
        pylibopus.api.multistream_encoder.encoder_ctl(
        self.msencoder_state, pylibopus.api.ctl.get_signal)

    def _set_signal(self, x): return \
        pylibopus.api.multistream_encoder.encoder_ctl(
        self.msencoder_state, pylibopus.api.ctl.set_signal, x)

    signal = property(_get_signal, _set_signal)

    def _get_application(self): return \
        pylibopus.api.multistream_encoder.encoder_ctl(
        self.msencoder_state, pylibopus.api.ctl.get_application)

    def _set_application(self, x): return \
        pylibopus.api.multistream_encoder.encoder_ctl(
        self.msencoder_state, pylibopus.api.ctl.set_application, x)

    application = property(_get_application, _set_application)

    def _get_sample_rate(self): return \
        pylibopus.api.multistream_encoder.encoder_ctl(
        self.msencoder_state, pylibopus.api.ctl.get_sample_rate)

    sample_rate = property(_get_sample_rate)

    def _get_lookahead(self): return \
        pylibopus.api.multistream_encoder.encoder_ctl(
        self.msencoder_state, pylibopus.api.ctl.get_lookahead)

    lookahead = property(_get_lookahead)

    def _get_inband_fec(self): return \
        pylibopus.api.multistream_encoder.encoder_ctl(
        self.msencoder_state, pylibopus.api.ctl.get_inband_fec)

    def _set_inband_fec(self, x): return \
        pylibopus.api.multistream_encoder.encoder_ctl(
        self.msencoder_state, pylibopus.api.ctl.set_inband_fec, x)

    inband_fec = property(_get_inband_fec, _set_inband_fec)

    def _get_packet_loss_perc(self): return \
        pylibopus.api.multistream_encoder.encoder_ctl(
        self.msencoder_state, pylibopus.api.ctl.get_packet_loss_perc)

    def _set_packet_loss_perc(self, x): return \
        pylibopus.api.multistream_encoder.encoder_ctl(
        self.msencoder_state, pylibopus.api.ctl.set_packet_loss_perc, x)

    packet_loss_perc = property(_get_packet_loss_perc, _set_packet_loss_perc)

    def _get_dtx(self): return \
        pylibopus.api.multistream_encoder.encoder_ctl(
        self.msencoder_state, pylibopus.api.ctl.get_dtx)

    def _set_dtx(self, x): return \
        pylibopus.api.multistream_encoder.encoder_ctl(
        self.msencoder_state, pylibopus.api.ctl.set_dtx, x)

    dtx = property(_get_dtx, _set_dtx)


class MultiStreamDecoder(object):
    """High-Level MultiStreamDecoder Object."""

    def __init__(self, fs: int, channels: int, streams: int,
                 coupled_streams: int, mapping: list) -> None:
        """
        :param fs: Sample Rate.
        :param channels: Number of channels.
        """
        self._fs = fs
        self._channels = channels
        self._streams = streams
        self._coupled_streams = coupled_streams
        self._mapping = mapping
        self.msdecoder_state = pylibopus.api.multistream_decoder.create_state(
            self._fs, self._channels, self._streams, self._coupled_streams,
            self._mapping)

    def __del__(self) -> None:
        if hasattr(self, 'msdecoder_state'):
            # Destroying state only if __init__ completed successfully
            pylibopus.api.multistream_decoder.destroy(self.msdecoder_state)

    def reset_state(self) -> None:
        """
        Resets the codec state to be equivalent to a freshly initialized state
        """
        pylibopus.api.multistream_decoder.decoder_ctl(
            self.msdecoder_state,
            pylibopus.api.ctl.reset_state
        )

    # FIXME: Remove typing.Any once we have a stub for ctypes
    def decode(
        self,
        opus_data: bytes,
        frame_size: int,
        decode_fec: bool = False
    ) -> typing.Union[bytes, typing.Any]:
        """
        Decodes given Opus data to PCM.
        """
        return pylibopus.api.multistream_decoder.decode(
            self.msdecoder_state,
            opus_data,
            len(opus_data),
            frame_size,
            decode_fec,
            channels=self._channels
        )

    # FIXME: Remove typing.Any once we have a stub for ctypes
    def decode_float(
        self,
        opus_data: bytes,
        frame_size: int,
        decode_fec: bool = False
    ) -> typing.Union[bytes, typing.Any]:
        """
        Decodes given Opus data to PCM.
        """
        return pylibopus.api.multistream_decoder.decode_float(
            self.msdecoder_state,
            opus_data,
            len(opus_data),
            frame_size,
            decode_fec,
            channels=self._channels
        )

    # CTL interfaces

    def _get_final_range(self): return \
        pylibopus.api.multistream_decoder.decoder_ctl(
        self.msdecoder_state, pylibopus.api.ctl.get_final_range)

    final_range = property(_get_final_range)

    def _get_bandwidth(self): return \
        pylibopus.api.multistream_decoder.decoder_ctl(
        self.msdecoder_state, pylibopus.api.ctl.get_bandwidth)

    bandwidth = property(_get_bandwidth)

    def _get_pitch(self): return \
        pylibopus.api.multistream_decoder.decoder_ctl(
        self.msdecoder_state, pylibopus.api.ctl.get_pitch)

    pitch = property(_get_pitch)

    def _get_lsb_depth(self): return \
        pylibopus.api.multistream_decoder.decoder_ctl(
        self.msdecoder_state, pylibopus.api.ctl.get_lsb_depth)

    def _set_lsb_depth(self, x): return \
        pylibopus.api.multistream_decoder.decoder_ctl(
        self.msdecoder_state, pylibopus.api.ctl.set_lsb_depth, x)

    lsb_depth = property(_get_lsb_depth, _set_lsb_depth)

    def _get_gain(self): return \
        pylibopus.api.multistream_decoder.decoder_ctl(
        self.msdecoder_state, pylibopus.api.ctl.get_gain)

    def _set_gain(self, x): return \
        pylibopus.api.multistream_decoder.decoder_ctl(
        self.msdecoder_state, pylibopus.api.ctl.set_gain, x)

    gain = property(_get_gain, _set_gain)


class ProjectionEncoder(object):
    """High-Level ProjectionEncoder Object."""

    def __init__(self, fs: int, channels: int, mapping_family: int,
                 streams: int, coupled_streams: int, application: int) -> None:
        """
        Parameters:
            fs : sampling rate
            channels : number of channels
        """
        # Check to see if the Encoder Application Macro is available:
        if application in list(pylibopus.APPLICATION_TYPES_MAP.keys()):
            application = pylibopus.APPLICATION_TYPES_MAP[application]
        elif application in list(pylibopus.APPLICATION_TYPES_MAP.values()):
            pass  # Nothing to do here
        else:
            raise ValueError(
                "`application` value must be in 'voip', 'audio' or "
                "'restricted_lowdelay'")

        self._fs = fs
        self._channels = channels
        self._mapping_family = mapping_family
        self._streams = streams
        self._coupled_streams = coupled_streams
        self._application = application
        self.projencoder_state = pylibopus.api.projection_encoder.create_state(
            self._fs, self._channels, self._mapping_family, self._streams,
            self._coupled_streams, self._application)

    def __del__(self) -> None:
        if hasattr(self, 'projencoder_state'):
            # Destroying state only if __init__ completed successfully
            pylibopus.api.projection_encoder.destroy(self.projencoder_state)

    def reset_state(self) -> None:
        """
        Resets the codec state to be equivalent to a freshly initialized state
        """
        pylibopus.api.projection_encoder.encoder_ctl(
            self.projencoder_state, pylibopus.api.ctl.reset_state)

    def encode(self, pcm_data: bytes, frame_size: int) -> bytes:
        """
        Encodes given PCM data as Opus.
        """
        return pylibopus.api.projection_encoder.encode(
            self.projencoder_state,
            pcm_data,
            frame_size,
            len(pcm_data)
        )

    def encode_float(self, pcm_data: bytes, frame_size: int) -> bytes:
        """
        Encodes given PCM data as Opus.
        """
        return pylibopus.api.projection_encoder.encode_float(
            self.projencoder_state,
            pcm_data,
            frame_size,
            len(pcm_data)
        )


    # CTL interfaces

    def _get_final_range(self): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state,
        pylibopus.api.ctl.get_final_range
    )

    final_range = property(_get_final_range)

    def _get_bandwidth(self): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.get_bandwidth)

    bandwidth = property(_get_bandwidth)

    def _get_pitch(self): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.get_pitch)

    pitch = property(_get_pitch)

    def _get_lsb_depth(self): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.get_lsb_depth)

    def _set_lsb_depth(self, x): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.set_lsb_depth, x)

    lsb_depth = property(_get_lsb_depth, _set_lsb_depth)

    def _get_complexity(self): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.get_complexity)

    def _set_complexity(self, x): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.set_complexity, x)

    complexity = property(_get_complexity, _set_complexity)

    def _get_bitrate(self): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.get_bitrate)

    def _set_bitrate(self, x): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.set_bitrate, x)

    bitrate = property(_get_bitrate, _set_bitrate)

    def _get_vbr(self): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.get_vbr)

    def _set_vbr(self, x): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.set_vbr, x)

    vbr = property(_get_vbr, _set_vbr)

    def _get_vbr_constraint(self): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.get_vbr_constraint)

    def _set_vbr_constraint(self, x): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.set_vbr_constraint, x)

    vbr_constraint = property(_get_vbr_constraint, _set_vbr_constraint)

    def _get_force_channels(self): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.get_force_channels)

    def _set_force_channels(self, x): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.set_force_channels, x)

    force_channels = property(_get_force_channels, _set_force_channels)

    def _get_max_bandwidth(self): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.get_max_bandwidth)

    def _set_max_bandwidth(self, x): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.set_max_bandwidth, x)

    max_bandwidth = property(_get_max_bandwidth, _set_max_bandwidth)

    def _set_bandwidth(self, x): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.set_bandwidth, x)

    bandwidth = property(None, _set_bandwidth)

    def _get_signal(self): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.get_signal)

    def _set_signal(self, x): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.set_signal, x)

    signal = property(_get_signal, _set_signal)

    def _get_application(self): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.get_application)

    def _set_application(self, x): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.set_application, x)

    application = property(_get_application, _set_application)

    def _get_sample_rate(self): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.get_sample_rate)

    sample_rate = property(_get_sample_rate)

    def _get_lookahead(self): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.get_lookahead)

    lookahead = property(_get_lookahead)

    def _get_inband_fec(self): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.get_inband_fec)

    def _set_inband_fec(self, x): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.set_inband_fec, x)

    inband_fec = property(_get_inband_fec, _set_inband_fec)

    def _get_packet_loss_perc(self): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.get_packet_loss_perc)

    def _set_packet_loss_perc(self, x): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.set_packet_loss_perc, x)

    packet_loss_perc = property(_get_packet_loss_perc, _set_packet_loss_perc)

    def _get_dtx(self): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.get_dtx)

    def _set_dtx(self, x): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.set_dtx, x)

    dtx = property(_get_dtx, _set_dtx)

    def _get_demixing_matrix_size(self): return \
        pylibopus.api.projection_encoder.encoder_ctl(
        self.projencoder_state, pylibopus.api.ctl.get_demixing_matrix_size)

    demixing_matrix_size = property(_get_demixing_matrix_size)

    def get_demixing_matrix(self, matrix_size): return \
        pylibopus.api.projection_encoder.get_demixing_matrix(
        self.projencoder_state, matrix_size)


class ProjectionDecoder(object):
    """High-Level ProjectionDecoder Object."""

    def __init__(self, fs: int, channels: int, streams: int,
                 coupled_streams: int, demixing_matrix: list) -> None:
        """
        :param fs: Sample Rate.
        :param channels: Number of channels.
        """
        self._fs = fs
        self._channels = channels
        self._streams = streams
        self._coupled_streams = coupled_streams
        self._demixing_matrix = demixing_matrix
        self.projdecoder_state = pylibopus.api.projection_decoder.create_state(
            self._fs, self._channels, self._streams, self._coupled_streams,
            self._demixing_matrix)

    def __del__(self) -> None:
        if hasattr(self, 'projdecoder_state'):
            # Destroying state only if __init__ completed successfully
            pylibopus.api.projection_decoder.destroy(self.projdecoder_state)

    def reset_state(self) -> None:
        """
        Resets the codec state to be equivalent to a freshly initialized state
        """
        pylibopus.api.projection_decoder.decoder_ctl(
            self.projdecoder_state,
            pylibopus.api.ctl.reset_state
        )

    # FIXME: Remove typing.Any once we have a stub for ctypes
    def decode(
        self,
        opus_data: bytes,
        frame_size: int,
        decode_fec: bool = False
    ) -> typing.Union[bytes, typing.Any]:
        """
        Decodes given Opus data to PCM.
        """
        return pylibopus.api.projection_decoder.decode(
            self.projdecoder_state,
            opus_data,
            len(opus_data),
            frame_size,
            decode_fec,
            channels=self._channels
        )

    # FIXME: Remove typing.Any once we have a stub for ctypes
    def decode_float(
        self,
        opus_data: bytes,
        frame_size: int,
        decode_fec: bool = False
    ) -> typing.Union[bytes, typing.Any]:
        """
        Decodes given Opus data to PCM.
        """
        return pylibopus.api.projection_decoder.decode_float(
            self.projdecoder_state,
            opus_data,
            len(opus_data),
            frame_size,
            decode_fec,
            channels=self._channels
        )




================================================
FILE: pylibopus/constants.py
================================================
#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
pylibopus constants.
Matches to `opus_defines.h`
"""

__author__ = 'Никита Кузнецов <self@svartalf.info>'
__copyright__ = 'Copyright (c) 2012, SvartalF'
__license__ = 'BSD 3-Clause License'


# No Error
OK = 0

# One or more invalid/out of range arguments
BAD_ARG = -1

# The mode struct passed is invalid
BUFFER_TOO_SMALL = -2

# An internal error was detected
INTERNAL_ERROR = -3

# The compressed data passed is corrupted
INVALID_PACKET = -4

# Invalid/unsupported request number
UNIMPLEMENTED = -5

# An encoder or decoder structure is invalid or already freed
INVALID_STATE = -6

# Memory allocation has failed
ALLOC_FAIL = -7


# Pre-defined values for CTL interface

APPLICATION_VOIP = 2048
APPLICATION_AUDIO = 2049
APPLICATION_RESTRICTED_LOWDELAY = 2051

SIGNAL_VOICE = 3001
SIGNAL_MUSIC = 3002

# Values for the various encoder CTLs

SET_APPLICATION_REQUEST = 4000
GET_APPLICATION_REQUEST = 4001
SET_BITRATE_REQUEST = 4002
GET_BITRATE_REQUEST = 4003
SET_MAX_BANDWIDTH_REQUEST = 4004
GET_MAX_BANDWIDTH_REQUEST = 4005
SET_VBR_REQUEST = 4006
GET_VBR_REQUEST = 4007
SET_BANDWIDTH_REQUEST = 4008
GET_BANDWIDTH_REQUEST = 4009
SET_COMPLEXITY_REQUEST = 4010
GET_COMPLEXITY_REQUEST = 4011
SET_INBAND_FEC_REQUEST = 4012
GET_INBAND_FEC_REQUEST = 4013
SET_PACKET_LOSS_PERC_REQUEST = 4014
GET_PACKET_LOSS_PERC_REQUEST = 4015
SET_DTX_REQUEST = 4016
GET_DTX_REQUEST = 4017
SET_VBR_CONSTRAINT_REQUEST = 4020
GET_VBR_CONSTRAINT_REQUEST = 4021
SET_FORCE_CHANNELS_REQUEST = 4022
GET_FORCE_CHANNELS_REQUEST = 4023
SET_SIGNAL_REQUEST = 4024
GET_SIGNAL_REQUEST = 4025
GET_LOOKAHEAD_REQUEST = 4027
RESET_STATE = 4028
GET_SAMPLE_RATE_REQUEST = 4029
GET_FINAL_RANGE_REQUEST = 4031
GET_PITCH_REQUEST = 4033
SET_GAIN_REQUEST = 4034
GET_GAIN_REQUEST = 4045  # Should have been 4035
SET_LSB_DEPTH_REQUEST = 4036
GET_LSB_DEPTH_REQUEST = 4037
GET_LAST_PACKET_DURATION_REQUEST = 4039
SET_EXPERT_FRAME_DURATION_REQUEST = 4040
GET_EXPERT_FRAME_DURATION_REQUEST = 4041
SET_PREDICTION_DISABLED_REQUEST = 4042
GET_PREDICTION_DISABLED_REQUEST = 4043

# Don't use 4045, it's already taken by OPUS_GET_GAIN_REQUEST

OPUS_PROJECTION_GET_DEMIXING_MATRIX_GAIN_REQUEST = 6001
OPUS_PROJECTION_GET_DEMIXING_MATRIX_SIZE_REQUEST = 6003
OPUS_PROJECTION_GET_DEMIXING_MATRIX_REQUEST = 6005

AUTO = -1000

BANDWIDTH_NARROWBAND = 1101
BANDWIDTH_MEDIUMBAND = 1102
BANDWIDTH_WIDEBAND = 1103
BANDWIDTH_SUPERWIDEBAND = 1104
BANDWIDTH_FULLBAND = 1105

APPLICATION_TYPES_MAP = {
    'voip': APPLICATION_VOIP,
    'audio': APPLICATION_AUDIO,
    'restricted_lowdelay': APPLICATION_RESTRICTED_LOWDELAY,
}



================================================
FILE: pylibopus/exceptions.py
================================================
#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Exceptions for pylibopus.
"""

import typing

import pylibopus.api.info

__author__ = 'Никита Кузнецов <self@svartalf.info>'
__copyright__ = 'Copyright (c) 2012, SvartalF'
__license__ = 'BSD 3-Clause License'


class OpusError(Exception):

    """
    Generic handler for pylibopus errors from C library.
    """

    def __init__(self, code: int) -> None:
        self.code = code
        super().__init__()

    # FIXME: Remove typing.Any once we have a stub for ctypes
    def __str__(self) -> typing.Union[str, typing.Any]:
        return str(pylibopus.api.info.strerror(self.code))



================================================
FILE: pylibopus/api/__init__.py
================================================
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# pylint: disable=invalid-name
#

"""OpusLib Package."""

import ctypes  # type: ignore

from ctypes.util import find_library  # type: ignore


lib_location = find_library('opus')

if lib_location is None:
    raise Exception(
        'Could not find Opus library. Make sure it is installed.')

libopus = ctypes.cdll.LoadLibrary(lib_location)


c_int_pointer = ctypes.POINTER(ctypes.c_int)
c_int16_pointer = ctypes.POINTER(ctypes.c_int16)
c_float_pointer = ctypes.POINTER(ctypes.c_float)
c_ubyte_pointer = ctypes.POINTER(ctypes.c_ubyte)



================================================
FILE: pylibopus/api/ctl.py
================================================
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# pylint: disable=invalid-name

"""CTL macros rewritten to Python

Usage example:

>>> import pylibopus.api.decoder
>>> import pylibopus.api.ctl
>>> dec = pylibopus.api.decoder.create_state(48000, 2)
>>> pylibopus.api.decoder.decoder_ctl(dec, pylibopus.api.ctl.set_gain, -15)
>>> gain_value = pylibopus.api.decoder.decoder_ctl(dec, pylibopus.api.ctl.get_gain)

"""

__author__ = 'Никита Кузнецов <self@svartalf.info>'
__copyright__ = 'Copyright (c) 2012, SvartalF'
__license__ = 'BSD 3-Clause License'


import ctypes  # type: ignore

import pylibopus.api
import pylibopus.exceptions


def query(request):

    """Query encoder/decoder with a request value"""

    def inner(func, obj):
        result_code = func(obj, request)

        if result_code is not pylibopus.OK:
            raise pylibopus.exceptions.OpusError(result_code)

        return result_code

    return inner


def get(request, result_type):

    """Get CTL value from a encoder/decoder"""

    def inner(func, obj):
        result = result_type()
        result_code = func(obj, request, ctypes.byref(result))

        if result_code is not pylibopus.OK:
            raise pylibopus.exceptions.OpusError(result_code)

        return result.value

    return inner


def ctl_set(request):

    """Set new CTL value to a encoder/decoder"""

    def inner(func, obj, value):
        result_code = func(obj, request, value)
        if result_code is not pylibopus.OK:
            raise pylibopus.exceptions.OpusError(result_code)

    return inner

#
# Generic CTLs
#

# Resets the codec state to be equivalent to a freshly initialized state
reset_state = query(pylibopus.RESET_STATE)  # NOQA

# Gets the final state of the codec's entropy coder
get_final_range = get(
    pylibopus.GET_FINAL_RANGE_REQUEST,
    ctypes.c_uint
)

# Gets the encoder's configured bandpass or the decoder's last bandpass
get_bandwidth = get(pylibopus.GET_BANDWIDTH_REQUEST, ctypes.c_int)

# Gets the pitch of the last decoded frame, if available
get_pitch = get(pylibopus.GET_PITCH_REQUEST, ctypes.c_int)

# Configures the depth of signal being encoded
set_lsb_depth = ctl_set(pylibopus.SET_LSB_DEPTH_REQUEST)

# Gets the encoder's configured signal depth
get_lsb_depth = get(pylibopus.GET_LSB_DEPTH_REQUEST, ctypes.c_int)

#
# Decoder related CTLs
#

# Gets the decoder's configured gain adjustment
get_gain = get(pylibopus.GET_GAIN_REQUEST, ctypes.c_int)

# Configures decoder gain adjustment
set_gain = ctl_set(pylibopus.SET_GAIN_REQUEST)

#
# Encoder related CTLs
#

# Configures the encoder's computational complexity
set_complexity = ctl_set(pylibopus.SET_COMPLEXITY_REQUEST)

# Gets the encoder's complexity configuration
get_complexity = get(
    pylibopus.GET_COMPLEXITY_REQUEST, ctypes.c_int)

# Configures the bitrate in the encoder
set_bitrate = ctl_set(pylibopus.SET_BITRATE_REQUEST)

# Gets the encoder's bitrate configuration
get_bitrate = get(pylibopus.GET_BITRATE_REQUEST, ctypes.c_int)

# Enables or disables variable bitrate (VBR) in the encoder
set_vbr = ctl_set(pylibopus.SET_VBR_REQUEST)

# Determine if variable bitrate (VBR) is enabled in the encoder
get_vbr = get(pylibopus.GET_VBR_REQUEST, ctypes.c_int)

# Enables or disables constrained VBR in the encoder
set_vbr_constraint = ctl_set(pylibopus.SET_VBR_CONSTRAINT_REQUEST)

# Determine if constrained VBR is enabled in the encoder
get_vbr_constraint = get(
    pylibopus.GET_VBR_CONSTRAINT_REQUEST, ctypes.c_int)

# Configures mono/stereo forcing in the encoder
set_force_channels = ctl_set(pylibopus.SET_FORCE_CHANNELS_REQUEST)

# Gets the encoder's forced channel configuration
get_force_channels = get(
    pylibopus.GET_FORCE_CHANNELS_REQUEST, ctypes.c_int)

# Configures the maximum bandpass that the encoder will select automatically
set_max_bandwidth = ctl_set(pylibopus.SET_MAX_BANDWIDTH_REQUEST)

# Gets the encoder's configured maximum allowed bandpass
get_max_bandwidth = get(
    pylibopus.GET_MAX_BANDWIDTH_REQUEST, ctypes.c_int)

# Sets the encoder's bandpass to a specific value
set_bandwidth = ctl_set(pylibopus.SET_BANDWIDTH_REQUEST)

# Configures the type of signal being encoded
set_signal = ctl_set(pylibopus.SET_SIGNAL_REQUEST)

# Gets the encoder's configured signal type
get_signal = get(pylibopus.GET_SIGNAL_REQUEST, ctypes.c_int)

# Configures the encoder's intended application
set_application = ctl_set(pylibopus.SET_APPLICATION_REQUEST)

# Gets the encoder's configured application
get_application = get(
    pylibopus.GET_APPLICATION_REQUEST, ctypes.c_int)

# Gets the sampling rate the encoder or decoder was initialized with
get_sample_rate = get(
    pylibopus.GET_SAMPLE_RATE_REQUEST, ctypes.c_int)

# Gets the total samples of delay added by the entire codec
get_lookahead = get(pylibopus.GET_LOOKAHEAD_REQUEST, ctypes.c_int)

# Configures the encoder's use of inband forward error correction (FEC)
set_inband_fec = ctl_set(pylibopus.SET_INBAND_FEC_REQUEST)

# Gets encoder's configured use of inband forward error correction
get_inband_fec = get(
    pylibopus.GET_INBAND_FEC_REQUEST, ctypes.c_int)

# Configures the encoder's expected packet loss percentage
set_packet_loss_perc = ctl_set(
    pylibopus.SET_PACKET_LOSS_PERC_REQUEST)

# Gets the encoder's configured packet loss percentage
get_packet_loss_perc = get(
    pylibopus.GET_PACKET_LOSS_PERC_REQUEST,
    ctypes.c_int
)

# Configures the encoder's use of discontinuous transmission (DTX)
set_dtx = ctl_set(pylibopus.SET_DTX_REQUEST)

# Gets encoder's configured use of discontinuous transmission
get_dtx = get(pylibopus.GET_DTX_REQUEST, ctypes.c_int)

#
# Other stuff
#

# get projection demixing matrix size
get_demixing_matrix_size = get(
    pylibopus.OPUS_PROJECTION_GET_DEMIXING_MATRIX_SIZE_REQUEST, ctypes.c_int)


unimplemented = query(pylibopus.UNIMPLEMENTED)



================================================
FILE: pylibopus/api/decoder.py
================================================
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# pylint: disable=invalid-name,too-few-public-methods
#

"""
CTypes mapping between libopus functions and Python.
"""

import array
import ctypes  # type: ignore
import typing

import pylibopus
import pylibopus.api

__author__ = 'Никита Кузнецов <self@svartalf.info>'
__copyright__ = 'Copyright (c) 2012, SvartalF'
__license__ = 'BSD 3-Clause License'


class Decoder(ctypes.Structure):
    """Opus decoder state.
    This contains the complete state of an Opus decoder.
    """
    pass


DecoderPointer = ctypes.POINTER(Decoder)


libopus_get_size = pylibopus.api.libopus.opus_decoder_get_size
libopus_get_size.argtypes = (ctypes.c_int,)
libopus_get_size.restype = ctypes.c_int
libopus_get_size.__doc__ = 'Gets the size of an OpusDecoder structure'


libopus_create = pylibopus.api.libopus.opus_decoder_create
libopus_create.argtypes = (
    ctypes.c_int,
    ctypes.c_int,
    pylibopus.api.c_int_pointer
)
libopus_create.restype = DecoderPointer


def create_state(fs: int, channels: int) -> ctypes.Structure:
    """
    Allocates and initializes a decoder state.
    Wrapper for C opus_decoder_create()

    `fs` must be one of 8000, 12000, 16000, 24000, or 48000.

    Internally Opus stores data at 48000 Hz, so that should be the default
    value for Fs. However, the decoder can efficiently decode to buffers
    at 8, 12, 16, and 24 kHz so if for some reason the caller cannot use data
    at the full sample rate, or knows the compressed data doesn't use the full
    frequency range, it can request decoding at a reduced rate. Likewise, the
    decoder is capable of filling in either mono or interleaved stereo pcm
    buffers, at the caller's request.

    :param fs: Sample rate to decode at (Hz).
    :param int: Number of channels (1 or 2) to decode.
    """
    result_code = ctypes.c_int()

    decoder_state = libopus_create(
        fs,
        channels,
        ctypes.byref(result_code)
    )

    if result_code.value != pylibopus.OK:
        raise pylibopus.exceptions.OpusError(result_code.value)

    return decoder_state


libopus_packet_get_bandwidth = pylibopus.api.libopus.opus_packet_get_bandwidth
# `argtypes` must be a sequence (,) of types!
libopus_packet_get_bandwidth.argtypes = (ctypes.c_char_p,)
libopus_packet_get_bandwidth.restype = ctypes.c_int


# FIXME: Remove typing.Any once we have a stub for ctypes
def packet_get_bandwidth(data: bytes) -> typing.Union[int, typing.Any]:
    """Gets the bandwidth of an Opus packet."""
    data_pointer = ctypes.c_char_p(data)

    result = libopus_packet_get_bandwidth(data_pointer)

    if result < 0:
        raise pylibopus.exceptions.OpusError(result)

    return result


libopus_packet_get_nb_channels = pylibopus.api.libopus.opus_packet_get_nb_channels  # NOQA
# `argtypes` must be a sequence (,) of types!
libopus_packet_get_nb_channels.argtypes = (ctypes.c_char_p,)
libopus_packet_get_nb_channels.restype = ctypes.c_int


# FIXME: Remove typing.Any once we have a stub for ctypes
def packet_get_nb_channels(data: bytes) -> typing.Union[int, typing.Any]:
    """Gets the number of channels from an Opus packet"""
    data_pointer = ctypes.c_char_p(data)

    result = libopus_packet_get_nb_channels(data_pointer)

    if result < 0:
        raise pylibopus.exceptions.OpusError(result)

    return result


libopus_packet_get_nb_frames = pylibopus.api.libopus.opus_packet_get_nb_frames
libopus_packet_get_nb_frames.argtypes = (ctypes.c_char_p, ctypes.c_int)
libopus_packet_get_nb_frames.restype = ctypes.c_int


# FIXME: Remove typing.Any once we have a stub for ctypes
def packet_get_nb_frames(
        data: bytes,
        length: typing.Optional[int] = None
) -> typing.Union[int, typing.Any]:
    """Gets the number of frames in an Opus packet"""
    data_pointer = ctypes.c_char_p(data)

    if length is None:
        length = len(data)

    result = libopus_packet_get_nb_frames(data_pointer, ctypes.c_int(length))

    if result < 0:
        raise pylibopus.exceptions.OpusError(result)

    return result


libopus_packet_get_samples_per_frame = \
    pylibopus.api.libopus.opus_packet_get_samples_per_frame
libopus_packet_get_samples_per_frame.argtypes = (ctypes.c_char_p, ctypes.c_int)
libopus_packet_get_samples_per_frame.restype = ctypes.c_int


# FIXME: Remove typing.Any once we have a stub for ctypes
def packet_get_samples_per_frame(
        data: bytes,
        fs: int
) -> typing.Union[int, typing.Any]:
    """Gets the number of samples per frame from an Opus packet"""
    data_pointer = ctypes.c_char_p(data)

    result = libopus_packet_get_nb_frames(data_pointer, ctypes.c_int(fs))

    if result < 0:
        raise pylibopus.exceptions.OpusError(result)

    return result


libopus_get_nb_samples = pylibopus.api.libopus.opus_decoder_get_nb_samples
libopus_get_nb_samples.argtypes = (
    DecoderPointer,
    ctypes.c_char_p,
    ctypes.c_int32
)
libopus_get_nb_samples.restype = ctypes.c_int


# FIXME: Remove typing.Any once we have a stub for ctypes
def get_nb_samples(
        decoder_state: ctypes.Structure,
        packet: bytes,
        length: int
) -> typing.Union[int, typing.Any]:
    """
    Gets the number of samples of an Opus packet.

    Parameters
    [in]	dec	OpusDecoder*: Decoder state
    [in]	packet	char*: Opus packet
    [in]	len	opus_int32: Length of packet

    Returns
    Number of samples

    Return values
    OPUS_BAD_ARG	Insufficient data was passed to the function
    OPUS_INVALID_PACKET	The compressed data passed is corrupted or of an
        unsupported type
    """
    result = libopus_get_nb_samples(decoder_state, packet, length)

    if result < 0:
        raise pylibopus.exceptions.OpusError(result)

    return result


libopus_decode = pylibopus.api.libopus.opus_decode
libopus_decode.argtypes = (
    DecoderPointer,
    ctypes.c_char_p,
    ctypes.c_int32,
    pylibopus.api.c_int16_pointer,
    ctypes.c_int,
    ctypes.c_int
)
libopus_decode.restype = ctypes.c_int


# FIXME: Remove typing.Any once we have a stub for ctypes
def decode(  # pylint: disable=too-many-arguments
        decoder_state: ctypes.Structure,
        opus_data: bytes,
        length: int,
        frame_size: int,
        decode_fec: bool,
        channels: int = 2
) -> typing.Union[bytes, typing.Any]:
    """
    Decode an Opus Frame to PCM.

    Unlike the `opus_decode` function , this function takes an additional
    parameter `channels`, which indicates the number of channels in the frame.
    """
    _decode_fec = int(decode_fec)
    result = 0

    pcm_size = frame_size * channels * ctypes.sizeof(ctypes.c_int16)
    pcm = (ctypes.c_int16 * pcm_size)()
    pcm_pointer = ctypes.cast(pcm, pylibopus.api.c_int16_pointer)

    result = libopus_decode(
        decoder_state,
        opus_data,
        length,
        pcm_pointer,
        frame_size,
        _decode_fec
    )

    if result < 0:
        raise pylibopus.exceptions.OpusError(result)

    return array.array('h', pcm_pointer[:result * channels]).tobytes()


libopus_decode_float = pylibopus.api.libopus.opus_decode_float
libopus_decode_float.argtypes = (
    DecoderPointer,
    ctypes.c_char_p,
    ctypes.c_int32,
    pylibopus.api.c_float_pointer,
    ctypes.c_int,
    ctypes.c_int
)
libopus_decode_float.restype = ctypes.c_int


# FIXME: Remove typing.Any once we have a stub for ctypes
def decode_float(  # pylint: disable=too-many-arguments
        decoder_state: ctypes.Structure,
        opus_data: bytes,
        length: int,
        frame_size: int,
        decode_fec: bool,
        channels: int = 2
) -> typing.Union[bytes, typing.Any]:
    """
    Decode an Opus Frame.

    Unlike the `opus_decode` function , this function takes an additional
    parameter `channels`, which indicates the number of channels in the frame.
    """
    _decode_fec = int(decode_fec)

    pcm_size = frame_size * channels * ctypes.sizeof(ctypes.c_float)
    pcm = (ctypes.c_float * pcm_size)()
    pcm_pointer = ctypes.cast(pcm, pylibopus.api.c_float_pointer)

    result = libopus_decode_float(
        decoder_state,
        opus_data,
        length,
        pcm_pointer,
        frame_size,
        _decode_fec
    )

    if result < 0:
        raise pylibopus.exceptions.OpusError(result)

    return array.array('f', pcm[:result * channels]).tobytes()


libopus_ctl = pylibopus.api.libopus.opus_decoder_ctl
libopus_ctl.argtypes = [DecoderPointer, ctypes.c_int,]  # variadic
libopus_ctl.restype = ctypes.c_int


# FIXME: Remove typing.Any once we have a stub for ctypes
def decoder_ctl(
        decoder_state: ctypes.Structure,
        request,
        value=None
) -> typing.Union[int, typing.Any]:
    if value is not None:
        return request(libopus_ctl, decoder_state, value)
    return request(libopus_ctl, decoder_state)


destroy = pylibopus.api.libopus.opus_decoder_destroy
destroy.argtypes = (DecoderPointer,)
destroy.restype = None
destroy.__doc__ = 'Frees an OpusDecoder allocated by opus_decoder_create()'



================================================
FILE: pylibopus/api/encoder.py
================================================
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# pylint: disable=invalid-name
#

"""
CTypes mapping between libopus functions and Python.
"""

import array
import ctypes  # type: ignore
import typing

import pylibopus
import pylibopus.api

__author__ = 'Никита Кузнецов <self@svartalf.info>'
__copyright__ = 'Copyright (c) 2012, SvartalF'
__license__ = 'BSD 3-Clause License'


class Encoder(ctypes.Structure):  # pylint: disable=too-few-public-methods
    """Opus encoder state.
    This contains the complete state of an Opus encoder.
    """
    pass


EncoderPointer = ctypes.POINTER(Encoder)


libopus_get_size = pylibopus.api.libopus.opus_encoder_get_size
libopus_get_size.argtypes = (ctypes.c_int,)  # must be sequence (,) of types!
libopus_get_size.restype = ctypes.c_int


# FIXME: Remove typing.Any once we have a stub for ctypes
def get_size(channels: int) -> typing.Union[int, typing.Any]:
    """Gets the size of an OpusEncoder structure."""
    if channels not in (1, 2):
        raise ValueError('Wrong channels value. Must be equal to 1 or 2')
    return libopus_get_size(channels)


libopus_create = pylibopus.api.libopus.opus_encoder_create
libopus_create.argtypes = (
    ctypes.c_int,
    ctypes.c_int,
    ctypes.c_int,
    pylibopus.api.c_int_pointer
)
libopus_create.restype = EncoderPointer


def create_state(fs: int, channels: int, application: int) -> ctypes.Structure:
    """Allocates and initializes an encoder state."""
    result_code = ctypes.c_int()

    result = libopus_create(
        fs,
        channels,
        application,
        ctypes.byref(result_code)
    )

    if result_code.value != pylibopus.OK:
        raise pylibopus.OpusError(result_code.value)

    return result


libopus_encode = pylibopus.api.libopus.opus_encode
libopus_encode.argtypes = (
    EncoderPointer,
    pylibopus.api.c_int16_pointer,
    ctypes.c_int,
    ctypes.c_char_p,
    ctypes.c_int32
)
libopus_encode.restype = ctypes.c_int32


# FIXME: Remove typing.Any once we have a stub for ctypes
def encode(
        encoder_state: ctypes.Structure,
        pcm_data: bytes,
        frame_size: int,
        max_data_bytes: int
) -> typing.Union[bytes, typing.Any]:
    """
    Encodes an Opus Frame.

    Returns string output payload.

    Parameters:
    [in]	st	OpusEncoder*: Encoder state
    [in]	pcm	opus_int16*: Input signal (interleaved if 2 channels). length
        is frame_size*channels*sizeof(opus_int16)
    [in]	frame_size	int: Number of samples per channel in the input signal.
        This must be an Opus frame size for the encoder's sampling rate. For
            example, at 48 kHz the permitted values are 120, 240, 480, 960,
            1920, and 2880. Passing in a duration of less than 10 ms
            (480 samples at 48 kHz) will prevent the encoder from using the
            LPC or hybrid modes.
    [out]	data	unsigned char*: Output payload. This must contain storage
        for at least max_data_bytes.
    [in]	max_data_bytes	opus_int32: Size of the allocated memory for the
        output payload. This may be used to impose an upper limit on the
        instant bitrate, but should not be used as the only bitrate control.
        Use OPUS_SET_BITRATE to control the bitrate.
    """
    pcm_pointer = ctypes.cast(pcm_data, pylibopus.api.c_int16_pointer)
    opus_data = (ctypes.c_char * max_data_bytes)()

    result = libopus_encode(
        encoder_state,
        pcm_pointer,
        frame_size,
        opus_data,
        max_data_bytes
    )

    if result < 0:
        raise pylibopus.OpusError(
            'Opus Encoder returned result="{}"'.format(result))

    return array.array('b', opus_data[:result]).tobytes()


libopus_encode_float = pylibopus.api.libopus.opus_encode_float
libopus_encode_float.argtypes = (
    EncoderPointer,
    pylibopus.api.c_float_pointer,
    ctypes.c_int,
    ctypes.c_char_p,
    ctypes.c_int32
)
libopus_encode_float.restype = ctypes.c_int32


# FIXME: Remove typing.Any once we have a stub for ctypes
def encode_float(
        encoder_state: ctypes.Structure,
        pcm_data: bytes,
        frame_size: int,
        max_data_bytes: int
) -> typing.Union[bytes, typing.Any]:
    """Encodes an Opus frame from floating point input"""
    pcm_pointer = ctypes.cast(pcm_data, pylibopus.api.c_float_pointer)
    opus_data = (ctypes.c_char * max_data_bytes)()

    result = libopus_encode_float(
        encoder_state,
        pcm_pointer,
        frame_size,
        opus_data,
        max_data_bytes
    )

    if result < 0:
        raise pylibopus.OpusError(
            'Encoder returned result="{}"'.format(result))

    return array.array('b', opus_data[:result]).tobytes()


libopus_ctl = pylibopus.api.libopus.opus_encoder_ctl
libopus_ctl.argtypes = [EncoderPointer, ctypes.c_int,]  # variadic
libopus_ctl.restype = ctypes.c_int


# FIXME: Remove typing.Any once we have a stub for ctypes
def encoder_ctl(
        encoder_state: ctypes.Structure,
        request,
        value=None
) -> typing.Union[int, typing.Any]:
    if value is not None:
        return request(libopus_ctl, encoder_state, value)
    return request(libopus_ctl, encoder_state)


destroy = pylibopus.api.libopus.opus_encoder_destroy
destroy.argtypes = (EncoderPointer,)  # must be sequence (,) of types!
destroy.restype = None
destroy.__doc__ = "Frees an OpusEncoder allocated by opus_encoder_create()"



================================================
FILE: pylibopus/api/info.py
================================================
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# pylint: disable=invalid-name
#

import ctypes  # type: ignore

import pylibopus.api

__author__ = 'Никита Кузнецов <self@svartalf.info>'
__copyright__ = 'Copyright (c) 2012, SvartalF'
__license__ = 'BSD 3-Clause License'


strerror = pylibopus.api.libopus.opus_strerror
strerror.argtypes = (ctypes.c_int,)  # must be sequence (,) of types!
strerror.restype = ctypes.c_char_p
strerror.__doc__ = 'Converts an opus error code into a human readable string'


get_version_string = pylibopus.api.libopus.opus_get_version_string
get_version_string.argtypes = None
get_version_string.restype = ctypes.c_char_p
get_version_string.__doc__ = 'Gets the libopus version string'



================================================
FILE: pylibopus/api/multistream_decoder.py
================================================
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# pylint: disable=invalid-name,too-few-public-methods
#

"""
CTypes mapping between libopus functions and Python.
"""

import array
import ctypes  # type: ignore
import typing

import pylibopus
import pylibopus.api

__author__ = 'Chris Hold>'
__copyright__ = 'Copyright (c) 2024, Chris Hold'
__license__ = 'BSD 3-Clause License'


class MultiStreamDecoder(ctypes.Structure):
    """Opus multi-stream decoder state.
    This contains the complete state of an Opus decoder.
    """
    pass


MultiStreamDecoderPointer = ctypes.POINTER(MultiStreamDecoder)


libopus_get_size = pylibopus.api.libopus.opus_multistream_decoder_get_size
libopus_get_size.argtypes = (ctypes.c_int, ctypes.c_int)
libopus_get_size.restype = ctypes.c_int
libopus_get_size.__doc__ = 'Gets the size of an OpusMSEncoder structure'


libopus_create = pylibopus.api.libopus.opus_multistream_decoder_create
libopus_create.argtypes = (
    ctypes.c_int,  # fs
    ctypes.c_int,  # channels
    ctypes.c_int,  # streams
    ctypes.c_int,  # coupled streams
    pylibopus.api.c_ubyte_pointer,  # mapping
    pylibopus.api.c_int_pointer  # error
)
libopus_create.restype = MultiStreamDecoderPointer


def create_state(fs: int, channels: int, streams: int, coupled_streams: int,
                 mapping: list) -> ctypes.Structure:
    """
    Allocates and initializes a decoder state.
    Wrapper for C opus_decoder_create()

    `fs` must be one of 8000, 12000, 16000, 24000, or 48000.

    Internally Opus stores data at 48000 Hz, so that should be the default
    value for Fs. However, the decoder can efficiently decode to buffers
    at 8, 12, 16, and 24 kHz so if for some reason the caller cannot use data
    at the full sample rate, or knows the compressed data doesn't use the full
    frequency range, it can request decoding at a reduced rate. Likewise, the
    decoder is capable of filling in either mono or interleaved stereo pcm
    buffers, at the caller's request.

    :param fs: Sample rate to decode at (Hz).
    """
    result_code = ctypes.c_int()
    _umapping = (ctypes.c_ubyte * len(mapping))(*mapping)

    decoder_state = libopus_create(
        fs,
        channels,
        streams,
        coupled_streams,
        _umapping,
        ctypes.byref(result_code)
    )

    if result_code.value != pylibopus.OK:
        raise pylibopus.exceptions.OpusError(result_code.value)

    return decoder_state


libopus_decode = pylibopus.api.libopus.opus_multistream_decode
libopus_decode.argtypes = (
    MultiStreamDecoderPointer,
    ctypes.c_char_p,
    ctypes.c_int32,
    pylibopus.api.c_int16_pointer,
    ctypes.c_int,
    ctypes.c_int
)
libopus_decode.restype = ctypes.c_int


# FIXME: Remove typing.Any once we have a stub for ctypes
def decode(  # pylint: disable=too-many-arguments
        decoder_state: ctypes.Structure,
        opus_data: bytes,
        length: int,
        frame_size: int,
        decode_fec: bool,
        channels: int = 2
) -> typing.Union[bytes, typing.Any]:
    """
    Decode an Opus Frame to PCM.

    Unlike the `opus_decode` function , this function takes an additional
    parameter `channels`, which indicates the number of channels in the frame.
    """
    _decode_fec = int(decode_fec)
    result = 0

    pcm_size = frame_size * channels * ctypes.sizeof(ctypes.c_int16)
    pcm = (ctypes.c_int16 * pcm_size)()
    pcm_pointer = ctypes.cast(pcm, pylibopus.api.c_int16_pointer)

    result = libopus_decode(
        decoder_state,
        opus_data,
        length,
        pcm_pointer,
        frame_size,
        _decode_fec
    )

    if result < 0:
        raise pylibopus.exceptions.OpusError(result)

    return array.array('h', pcm_pointer[:result * channels]).tobytes()


libopus_decode_float = pylibopus.api.libopus.opus_multistream_decode_float
libopus_decode_float.argtypes = (
    MultiStreamDecoderPointer,
    ctypes.c_char_p,
    ctypes.c_int32,
    pylibopus.api.c_float_pointer,
    ctypes.c_int,
    ctypes.c_int
)
libopus_decode_float.restype = ctypes.c_int


# FIXME: Remove typing.Any once we have a stub for ctypes
def decode_float(  # pylint: disable=too-many-arguments
        decoder_state: ctypes.Structure,
        opus_data: bytes,
        length: int,
        frame_size: int,
        decode_fec: bool,
        channels: int = 2
) -> typing.Union[bytes, typing.Any]:
    """
    Decode an Opus Frame.

    Unlike the `opus_decode` function , this function takes an additional
    parameter `channels`, which indicates the number of channels in the frame.
    """
    _decode_fec = int(decode_fec)

    pcm_size = frame_size * channels * ctypes.sizeof(ctypes.c_float)
    pcm = (ctypes.c_float * pcm_size)()
    pcm_pointer = ctypes.cast(pcm, pylibopus.api.c_float_pointer)

    result = libopus_decode_float(
        decoder_state,
        opus_data,
        length,
        pcm_pointer,
        frame_size,
        _decode_fec
    )

    if result < 0:
        raise pylibopus.exceptions.OpusError(result)

    return array.array('f', pcm[:result * channels]).tobytes()


libopus_ctl = pylibopus.api.libopus.opus_multistream_decoder_ctl
libopus_ctl.argtypes = [MultiStreamDecoderPointer, ctypes.c_int,]  # variadic
libopus_ctl.restype = ctypes.c_int


# FIXME: Remove typing.Any once we have a stub for ctypes
def decoder_ctl(
        decoder_state: ctypes.Structure,
        request,
        value=None
) -> typing.Union[int, typing.Any]:
    if value is not None:
        return request(libopus_ctl, decoder_state, value)
    return request(libopus_ctl, decoder_state)


destroy = pylibopus.api.libopus.opus_multistream_decoder_destroy
destroy.argtypes = (MultiStreamDecoderPointer,)
destroy.restype = None
destroy.__doc__ = 'Frees an OpusMultistreamDecoder allocated by opus_multistream_decoder_create()'



================================================
FILE: pylibopus/api/multistream_encoder.py
================================================
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# pylint: disable=invalid-name
#

"""
CTypes mapping between libopus functions and Python.
"""

import array
import ctypes  # type: ignore
import typing

import pylibopus
import pylibopus.api

__author__ = 'Chris Hold'
__copyright__ = 'Copyright (c) 2024, Chris Hold'
__license__ = 'BSD 3-Clause License'


class MultiStreamEncoder(ctypes.Structure):  # pylint: disable=too-few-public-methods
    """Opus multi-stream encoder state.
    This contains the complete state of an Opus encoder.
    """
    pass


MultiStreamEncoderPointer = ctypes.POINTER(MultiStreamEncoder)


libopus_get_size = pylibopus.api.libopus.opus_multistream_encoder_get_size
libopus_get_size.argtypes = (ctypes.c_int, ctypes.c_int)
libopus_get_size.restype = ctypes.c_int


# FIXME: Remove typing.Any once we have a stub for ctypes
def get_size(streams: int, coupled_streams: int) -> typing.Union[int, typing.Any]:
    """Gets the size of an MultiStreamOpusEncoder structure."""
    return libopus_get_size(streams, coupled_streams)


libopus_create = pylibopus.api.libopus.opus_multistream_encoder_create
libopus_create.argtypes = (
    ctypes.c_int,  # fs
    ctypes.c_int,  # channels
    ctypes.c_int,  # streams
    ctypes.c_int,  # coupled streams
    pylibopus.api.c_ubyte_pointer,  # mapping
    ctypes.c_int,  # application
    pylibopus.api.c_int_pointer  # error
)
libopus_create.restype = MultiStreamEncoderPointer


def create_state(fs: int, channels: int, streams: int, coupled_streams: int,
                 mapping: list, application: int) -> ctypes.Structure:
    """Allocates and initializes a multi-stream encoder state."""
    result_code = ctypes.c_int()
    _umapping = (ctypes.c_ubyte * len(mapping))(*mapping)

    encoder_state = libopus_create(
        fs,
        channels,
        streams,
        coupled_streams,
        _umapping,
        application,
        ctypes.byref(result_code)
    )

    if result_code.value != pylibopus.OK:
        raise pylibopus.OpusError(result_code.value)

    return encoder_state


libopus_multistream_encode = pylibopus.api.libopus.opus_multistream_encode
libopus_multistream_encode.argtypes = (
    MultiStreamEncoderPointer,
    pylibopus.api.c_int16_pointer,
    ctypes.c_int,
    ctypes.c_char_p,
    ctypes.c_int32
)
libopus_multistream_encode.restype = ctypes.c_int32


# FIXME: Remove typing.Any once we have a stub for ctypes
def encode(
        encoder_state: ctypes.Structure,
        pcm_data: bytes,
        frame_size: int,
        max_data_bytes: int
) -> typing.Union[bytes, typing.Any]:
    """
    Encodes an Opus Frame.

    Returns string output payload.

    Parameters:
    [in]	st	OpusEncoder*: Encoder state
    [in]	pcm	opus_int16*: Input signal (interleaved if 2 channels). length
        is frame_size*channels*sizeof(opus_int16)
    [in]	frame_size	int: Number of samples per channel in the input signal.
        This must be an Opus frame size for the encoder's sampling rate. For
            example, at 48 kHz the permitted values are 120, 240, 480, 960,
            1920, and 2880. Passing in a duration of less than 10 ms
            (480 samples at 48 kHz) will prevent the encoder from using the
            LPC or hybrid modes.
    [out]	data	unsigned char*: Output payload. This must contain storage
        for at least max_data_bytes.
    [in]	max_data_bytes	opus_int32: Size of the allocated memory for the
        output payload. This may be used to impose an upper limit on the
        instant bitrate, but should not be used as the only bitrate control.
        Use OPUS_SET_BITRATE to control the bitrate.
    """
    pcm_pointer = ctypes.cast(pcm_data, pylibopus.api.c_int16_pointer)
    opus_data = (ctypes.c_char * max_data_bytes)()

    result = libopus_multistream_encode(
        encoder_state,
        pcm_pointer,
        frame_size,
        opus_data,
        max_data_bytes
    )

    if result < 0:
        raise pylibopus.OpusError(
            'Opus Encoder returned result="{}"'.format(result))

    return array.array('b', opus_data[:result]).tobytes()


libopus_multistream_encode_float = pylibopus.api.libopus.opus_multistream_encode_float
libopus_multistream_encode_float.argtypes = (
    MultiStreamEncoderPointer,
    pylibopus.api.c_float_pointer,
    ctypes.c_int,
    ctypes.c_char_p,
    ctypes.c_int32
)
libopus_multistream_encode_float.restype = ctypes.c_int32


# FIXME: Remove typing.Any once we have a stub for ctypes
def encode_float(
        encoder_state: ctypes.Structure,
        pcm_data: bytes,
        frame_size: int,
        max_data_bytes: int
) -> typing.Union[bytes, typing.Any]:
    """Encodes an Opus frame from floating point input"""
    pcm_pointer = ctypes.cast(pcm_data, pylibopus.api.c_float_pointer)
    opus_data = (ctypes.c_char * max_data_bytes)()

    result = libopus_multistream_encode_float(
        encoder_state,
        pcm_pointer,
        frame_size,
        opus_data,
        max_data_bytes
    )

    if result < 0:
        raise pylibopus.OpusError(
            'Encoder returned result="{}"'.format(result))

    return array.array('b', opus_data[:result]).tobytes()


libopus_ctl = pylibopus.api.libopus.opus_multistream_encoder_ctl
libopus_ctl.argtypes = [MultiStreamEncoderPointer, ctypes.c_int,]  # variadic
libopus_ctl.restype = ctypes.c_int


# FIXME: Remove typing.Any once we have a stub for ctypes
def encoder_ctl(
        encoder_state: ctypes.Structure,
        request,
        value=None
) -> typing.Union[int, typing.Any]:
    if value is not None:
        return request(libopus_ctl, encoder_state, value)
    return request(libopus_ctl, encoder_state)


destroy = pylibopus.api.libopus.opus_multistream_encoder_destroy
destroy.argtypes = (MultiStreamEncoderPointer,)  # must be sequence (,) of types!
destroy.restype = None
destroy.__doc__ = "Frees an OpusEncoder allocated by opus_multistream_encoder_create()"



================================================
FILE: pylibopus/api/projection_decoder.py
================================================
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# pylint: disable=invalid-name,too-few-public-methods
#

"""
CTypes mapping between libopus functions and Python.
"""

import array
import ctypes  # type: ignore
import typing

import pylibopus
import pylibopus.api

__author__ = 'Chris Hold>'
__copyright__ = 'Copyright (c) 2024, Chris Hold'
__license__ = 'BSD 3-Clause License'


class ProjectionDecoder(ctypes.Structure):
    """Opus multi-stream decoder state.
    This contains the complete state of an Opus decoder.
    """
    pass


ProjectionDecoderPointer = ctypes.POINTER(ProjectionDecoder)


libopus_get_size = pylibopus.api.libopus.opus_projection_decoder_get_size
libopus_get_size.argtypes = (ctypes.c_int, ctypes.c_int)
libopus_get_size.restype = ctypes.c_int
libopus_get_size.__doc__ = 'Gets the size of an OpusProjectionDecoder structure'


libopus_create = pylibopus.api.libopus.opus_projection_decoder_create
libopus_create.argtypes = (
    ctypes.c_int,  # fs
    ctypes.c_int,  # channels
    ctypes.c_int,  # streams
    ctypes.c_int,  # coupled streams
    pylibopus.api.c_ubyte_pointer,  # demixing_matrix
    ctypes.c_int,  # demixing_matrix_size
    pylibopus.api.c_int_pointer  # error
)
libopus_create.restype = ProjectionDecoderPointer


def create_state(fs: int, channels: int, streams: int, coupled_streams: int,
                 demixing_matrix: list) -> ctypes.Structure:
    """
    Allocates and initializes a decoder state.

    `fs` must be one of 8000, 12000, 16000, 24000, or 48000.

    :param fs: Sample rate to decode at (Hz).
    """
    result_code = ctypes.c_int()
    _udemixing_matrix = (ctypes.c_ubyte * len(demixing_matrix))(*demixing_matrix)
    demixing_matrix_size = ctypes.c_int(len(demixing_matrix))

    decoder_state = libopus_create(
        fs,
        channels,
        streams,
        coupled_streams,
        _udemixing_matrix,
        demixing_matrix_size,
        ctypes.byref(result_code)
    )

    if result_code.value != pylibopus.OK:
        raise pylibopus.exceptions.OpusError(result_code.value)

    return decoder_state


libopus_decode = pylibopus.api.libopus.opus_projection_decode
libopus_decode.argtypes = (
    ProjectionDecoderPointer,
    ctypes.c_char_p,
    ctypes.c_int32,
    pylibopus.api.c_int16_pointer,
    ctypes.c_int,
    ctypes.c_int
)
libopus_decode.restype = ctypes.c_int


# FIXME: Remove typing.Any once we have a stub for ctypes
def decode(  # pylint: disable=too-many-arguments
        decoder_state: ctypes.Structure,
        opus_data: bytes,
        length: int,
        frame_size: int,
        decode_fec: bool,
        channels: int = 2
) -> typing.Union[bytes, typing.Any]:
    """
    Decode an Opus Frame to PCM.

    Unlike the `opus_decode` function , this function takes an additional
    parameter `channels`, which indicates the number of channels in the frame.
    """
    _decode_fec = int(decode_fec)
    result = 0

    pcm_size = frame_size * channels * ctypes.sizeof(ctypes.c_int16)
    pcm = (ctypes.c_int16 * pcm_size)()
    pcm_pointer = ctypes.cast(pcm, pylibopus.api.c_int16_pointer)

    result = libopus_decode(
        decoder_state,
        opus_data,
        length,
        pcm_pointer,
        frame_size,
        _decode_fec
    )

    if result < 0:
        raise pylibopus.exceptions.OpusError(result)

    return array.array('h', pcm_pointer[:result * channels]).tobytes()


libopus_decode_float = pylibopus.api.libopus.opus_projection_decode_float
libopus_decode_float.argtypes = (
    ProjectionDecoderPointer,
    ctypes.c_char_p,
    ctypes.c_int32,
    pylibopus.api.c_float_pointer,
    ctypes.c_int,
    ctypes.c_int
)
libopus_decode_float.restype = ctypes.c_int


# FIXME: Remove typing.Any once we have a stub for ctypes
def decode_float(  # pylint: disable=too-many-arguments
        decoder_state: ctypes.Structure,
        opus_data: bytes,
        length: int,
        frame_size: int,
        decode_fec: bool,
        channels: int = 2
) -> typing.Union[bytes, typing.Any]:
    """
    Decode an Opus Frame.

    Unlike the `opus_decode` function , this function takes an additional
    parameter `channels`, which indicates the number of channels in the frame.
    """
    _decode_fec = int(decode_fec)

    pcm_size = frame_size * channels * ctypes.sizeof(ctypes.c_float)
    pcm = (ctypes.c_float * pcm_size)()
    pcm_pointer = ctypes.cast(pcm, pylibopus.api.c_float_pointer)

    result = libopus_decode_float(
        decoder_state,
        opus_data,
        length,
        pcm_pointer,
        frame_size,
        _decode_fec
    )

    if result < 0:
        raise pylibopus.exceptions.OpusError(result)

    return array.array('f', pcm[:result * channels]).tobytes()


libopus_ctl = pylibopus.api.libopus.opus_projection_decoder_ctl
libopus_ctl.argtypes = [ProjectionDecoderPointer, ctypes.c_int,]  # variadic
libopus_ctl.restype = ctypes.c_int


# FIXME: Remove typing.Any once we have a stub for ctypes
def decoder_ctl(
        decoder_state: ctypes.Structure,
        request,
        value=None
) -> typing.Union[int, typing.Any]:
    if value is not None:
        return request(libopus_ctl, decoder_state, value)
    return request(libopus_ctl, decoder_state)


destroy = pylibopus.api.libopus.opus_projection_decoder_destroy
destroy.argtypes = (ProjectionDecoderPointer,)
destroy.restype = None
destroy.__doc__ = 'Frees an OpusProjectionDecoder allocated by opus_projection_decoder_create()'



================================================
FILE: pylibopus/api/projection_encoder.py
================================================
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# pylint: disable=invalid-name
#

"""
CTypes mapping between libopus functions and Python.
"""

import array
import ctypes  # type: ignore
import typing

import pylibopus
import pylibopus.api

__author__ = 'Chris Hold'
__copyright__ = 'Copyright (c) 2024, Chris Hold'
__license__ = 'BSD 3-Clause License'


class ProjectionEncoder(ctypes.Structure):  # pylint: disable=too-few-public-methods
    """Opus projection encoder state.
    This contains the complete state of an Opus encoder.
    """
    pass


ProjectionEncoderPointer = ctypes.POINTER(ProjectionEncoder)


libopus_get_size = pylibopus.api.libopus.opus_projection_ambisonics_encoder_get_size
libopus_get_size.argtypes = (ctypes.c_int, ctypes.c_int)
libopus_get_size.restype = ctypes.c_int


# FIXME: Remove typing.Any once we have a stub for ctypes
def get_size(channels: int, mapping_family: int) -> typing.Union[int, typing.Any]:
    """Gets the size of an ProjectionOpusEncoder structure."""
    return libopus_get_size(channels, mapping_family)


libopus_create = pylibopus.api.libopus.opus_projection_ambisonics_encoder_create
libopus_create.argtypes = (
    ctypes.c_int,  # fs
    ctypes.c_int,  # channels
    ctypes.c_int,  # mapping_family
    pylibopus.api.c_int_pointer,  # streams
    pylibopus.api.c_int_pointer,  # coupled streams
    ctypes.c_int,  # application
    pylibopus.api.c_int_pointer  # error
)
libopus_create.restype = ProjectionEncoderPointer


def create_state(fs: int, channels: int, mapping_family: int, streams: int,
                 coupled_streams: int, application: int) -> ctypes.Structure:
    """Allocates and initializes a projection encoder state."""
    result_code = ctypes.c_int()
    streams_ = ctypes.c_int(streams)
    coupled_streams_ = ctypes.c_int(coupled_streams)

    encoder_state = libopus_create(
        fs,
        channels,
        mapping_family,
        streams_,
        coupled_streams_,
        application,
        ctypes.byref(result_code)
    )

    if result_code.value != pylibopus.OK:
        raise pylibopus.OpusError(result_code.value)

    return encoder_state


libopus_projection_encode = pylibopus.api.libopus.opus_projection_encode
libopus_projection_encode.argtypes = (
    ProjectionEncoderPointer,
    pylibopus.api.c_int16_pointer,
    ctypes.c_int,
    ctypes.c_char_p,
    ctypes.c_int32
)
libopus_projection_encode.restype = ctypes.c_int32


# FIXME: Remove typing.Any once we have a stub for ctypes
def encode(
        encoder_state: ctypes.Structure,
        pcm_data: bytes,
        frame_size: int,
        max_data_bytes: int
) -> typing.Union[bytes, typing.Any]:
    """
    Encodes an Opus Frame.

    Returns string output payload.

    Parameters:
    [in]	st	OpusEncoder*: Encoder state
    [in]	pcm	opus_int16*: Input signal (interleaved if 2 channels). length
        is frame_size*channels*sizeof(opus_int16)
    [in]	frame_size	int: Number of samples per channel in the input signal.
        This must be an Opus frame size for the encoder's sampling rate. For
            example, at 48 kHz the permitted values are 120, 240, 480, 960,
            1920, and 2880. Passing in a duration of less than 10 ms
            (480 samples at 48 kHz) will prevent the encoder from using the
            LPC or hybrid modes.
    [out]	data	unsigned char*: Output payload. This must contain storage
        for at least max_data_bytes.
    [in]	max_data_bytes	opus_int32: Size of the allocated memory for the
        output payload. This may be used to impose an upper limit on the
        instant bitrate, but should not be used as the only bitrate control.
        Use OPUS_SET_BITRATE to control the bitrate.
    """
    pcm_pointer = ctypes.cast(pcm_data, pylibopus.api.c_int16_pointer)
    opus_data = (ctypes.c_char * max_data_bytes)()

    result = libopus_projection_encode(
        encoder_state,
        pcm_pointer,
        frame_size,
        opus_data,
        max_data_bytes
    )

    if result < 0:
        raise pylibopus.OpusError(
            'Opus Encoder returned result="{}"'.format(result))

    return array.array('b', opus_data[:result]).tobytes()


libopus_projection_encode_float = pylibopus.api.libopus.opus_projection_encode_float
libopus_projection_encode_float.argtypes = (
    ProjectionEncoderPointer,
    pylibopus.api.c_float_pointer,
    ctypes.c_int,
    ctypes.c_char_p,
    ctypes.c_int32
)
libopus_projection_encode_float.restype = ctypes.c_int32


# FIXME: Remove typing.Any once we have a stub for ctypes
def encode_float(
        encoder_state: ctypes.Structure,
        pcm_data: bytes,
        frame_size: int,
        max_data_bytes: int
) -> typing.Union[bytes, typing.Any]:
    """Encodes an Opus frame from floating point input"""
    pcm_pointer = ctypes.cast(pcm_data, pylibopus.api.c_float_pointer)
    opus_data = (ctypes.c_char * max_data_bytes)()

    result = libopus_projection_encode_float(
        encoder_state,
        pcm_pointer,
        frame_size,
        opus_data,
        max_data_bytes
    )

    if result < 0:
        raise pylibopus.OpusError(
            'Encoder returned result="{}"'.format(result))

    return array.array('b', opus_data[:result]).tobytes()


def get_demixing_matrix(
        encoder_state: ctypes.Structure,
        matrix_size
) -> typing.Union[int, typing.Any]:
    matrix = (ctypes.c_ubyte * matrix_size)()
    pmatrix = ctypes.cast(matrix, pylibopus.api.c_ubyte_pointer)
    ret = libopus_ctl(
        encoder_state,
        pylibopus.OPUS_PROJECTION_GET_DEMIXING_MATRIX_REQUEST,
        pmatrix,
        matrix_size)
    if ret != pylibopus.OK:
        raise pylibopus.OpusError(ret)
    return matrix


libopus_ctl = pylibopus.api.libopus.opus_projection_encoder_ctl
libopus_ctl.argtypes = [ProjectionEncoderPointer, ctypes.c_int,]  # variadic
libopus_ctl.restype = ctypes.c_int


# FIXME: Remove typing.Any once we have a stub for ctypes
def encoder_ctl(
        encoder_state: ctypes.Structure,
        request,
        value=None
) -> typing.Union[int, typing.Any]:
    if value is not None:
        return request(libopus_ctl, encoder_state, value)
    return request(libopus_ctl, encoder_state)


destroy = pylibopus.api.libopus.opus_projection_encoder_destroy
destroy.argtypes = (ProjectionEncoderPointer,)  # must be sequence (,) of types!
destroy.restype = None
destroy.__doc__ = "Frees an OpusEncoder allocated by opus_projection_encoder_create()"



================================================
FILE: tests/__init__.py
================================================
#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""Tests for opuslib."""

__author__ = 'Никита Кузнецов <self@svartalf.info>'
__copyright__ = 'Copyright (c) 2012, SvartalF'
__license__ = 'BSD 3-Clause License'



================================================
FILE: tests/decoder.py
================================================
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# pylint: disable=missing-docstring
#

import sys
import unittest

import pylibopus.api
import pylibopus.api.decoder
import pylibopus.api.ctl

__author__ = 'Никита Кузнецов <self@svartalf.info>'
__copyright__ = 'Copyright (c) 2012, SvartalF'
__license__ = 'BSD 3-Clause License'


class DecoderTest(unittest.TestCase):
    """Decoder basic API tests

    From the `tests/test_opus_api.c`
    """

    def test_get_size(self):
        """Invalid configurations which should fail"""

        for csx in range(4):
            ixx = pylibopus.api.decoder.libopus_get_size(csx)
            if csx in (1, 2):
                self.assertFalse(1 << 16 < ixx <= 2048)
            else:
                self.assertEqual(ixx, 0)

    def _test_unsupported_sample_rates(self):
        """
        Unsupported sample rates

        TODO: make the same test with a opus_decoder_init() function
        """
        for csx in range(4):
            for ixx in range(-7, 96000):
                if ixx in (8000, 12000, 16000, 24000, 48000) and csx in (1, 2):
                    continue

                if ixx == -5:
                    fsx = -8000
                elif ixx == -6:
                    fsx = sys.maxsize  # TODO: should be a INT32_MAX
                elif ixx == -7:
                    fsx = -1 * (sys.maxsize - 1)  # Emulation of the INT32_MIN
                else:
                    fsx = ixx

                try:
                    dec = pylibopus.api.decoder.create_state(fsx, csx)
                except pylibopus.OpusError as exc:
                    self.assertEqual(exc.code, pylibopus.BAD_ARG)
                else:
                    pylibopus.api.decoder.destroy(dec)

    @classmethod
    def test_create(cls):
        try:
            dec = pylibopus.api.decoder.create_state(48000, 2)
        except pylibopus.OpusError:
            raise AssertionError()
        else:
            pylibopus.api.decoder.destroy(dec)

            # TODO: rewrite this code
        # VG_CHECK(dec,opus_decoder_get_size(2));

    @classmethod
    def test_get_final_range(cls):
        dec = pylibopus.api.decoder.create_state(48000, 2)
        pylibopus.api.decoder.decoder_ctl(dec, pylibopus.api.ctl.get_final_range)
        pylibopus.api.decoder.destroy(dec)

    def test_unimplemented(self):
        dec = pylibopus.api.decoder.create_state(48000, 2)

        try:
            pylibopus.api.decoder.decoder_ctl(
                dec, pylibopus.api.ctl.unimplemented)
        except pylibopus.OpusError as exc:
            self.assertEqual(exc.code, pylibopus.UNIMPLEMENTED)

        pylibopus.api.decoder.destroy(dec)

    def test_get_bandwidth(self):
        dec = pylibopus.api.decoder.create_state(48000, 2)
        value = pylibopus.api.decoder.decoder_ctl(
            dec, pylibopus.api.ctl.get_bandwidth)
        self.assertEqual(value, 0)
        pylibopus.api.decoder.destroy(dec)

    def test_get_pitch(self):
        dec = pylibopus.api.decoder.create_state(48000, 2)

        i = pylibopus.api.decoder.decoder_ctl(dec, pylibopus.api.ctl.get_pitch)
        self.assertIn(i, (-1, 0))

        packet = bytes([252, 0, 0])
        pylibopus.api.decoder.decode(dec, packet, 3, 960, False)
        i = pylibopus.api.decoder.decoder_ctl(dec, pylibopus.api.ctl.get_pitch)
        self.assertIn(i, (-1, 0))

        packet = bytes([1, 0, 0])
        pylibopus.api.decoder.decode(dec, packet, 3, 960, False)
        i = pylibopus.api.decoder.decoder_ctl(dec, pylibopus.api.ctl.get_pitch)
        self.assertIn(i, (-1, 0))

        pylibopus.api.decoder.destroy(dec)

    def test_gain(self):
        dec = pylibopus.api.decoder.create_state(48000, 2)

        i = pylibopus.api.decoder.decoder_ctl(dec, pylibopus.api.ctl.get_gain)
        self.assertEqual(i, 0)

        try:
            pylibopus.api.decoder.decoder_ctl(
                dec, pylibopus.api.ctl.set_gain, -32769)
        except pylibopus.OpusError as exc:
            self.assertEqual(exc.code, pylibopus.BAD_ARG)

        try:
            pylibopus.api.decoder.decoder_ctl(
                dec, pylibopus.api.ctl.set_gain, 32768)
        except pylibopus.OpusError as exc:
            self.assertEqual(exc.code, pylibopus.BAD_ARG)

        pylibopus.api.decoder.decoder_ctl(dec, pylibopus.api.ctl.set_gain, -15)
        i = pylibopus.api.decoder.decoder_ctl(dec, pylibopus.api.ctl.get_gain)
        self.assertEqual(i, -15)

        pylibopus.api.decoder.destroy(dec)

    @classmethod
    def test_reset_state(cls):
        dec = pylibopus.api.decoder.create_state(48000, 2)
        pylibopus.api.decoder.decoder_ctl(dec, pylibopus.api.ctl.reset_state)
        pylibopus.api.decoder.destroy(dec)

    def test_get_nb_samples(self):
        """opus_decoder_get_nb_samples()"""

        dec = pylibopus.api.decoder.create_state(48000, 2)

        self.assertEqual(
            480, pylibopus.api.decoder.get_nb_samples(dec, bytes([0]), 1))

        packet = bytes()
        for xxc in ((63 << 2) | 3, 63):
            packet += bytes([xxc])

        # TODO: check for exception code
        self.assertRaises(
            pylibopus.OpusError,
            lambda: pylibopus.api.decoder.get_nb_samples(dec, packet, 2)
        )

        pylibopus.api.decoder.destroy(dec)

    def test_packet_get_nb_frames(self):
        """opus_packet_get_nb_frames()"""

        packet = bytes()
        for xxc in ((63 << 2) | 3, 63):
            packet += bytes([xxc])

        self.assertRaises(
            pylibopus.OpusError,
            lambda: pylibopus.api.decoder.packet_get_nb_frames(packet, 0)
        )

        l1res = (1, 2, 2, pylibopus.INVALID_PACKET)

        for ixc in range(0, 256):
            packet = bytes([ixc])
            expected_result = l1res[ixc & 3]

            try:
                self.assertEqual(
                    expected_result,
                    pylibopus.api.decoder.packet_get_nb_frames(packet, 1)
                )
            except pylibopus.OpusError as exc:
                if exc.code == expected_result:
                    continue

            for jxc in range(0, 256):
                packet = bytes([ixc, jxc])

                self.assertEqual(
                    expected_result if expected_result != 3 else (packet[1] & 63),  # NOQA
                    pylibopus.api.decoder.packet_get_nb_frames(packet, 2)
                )

    def test_packet_get_bandwidth(self):
        """Tests `pylibopus.api.decoder.opus_packet_get_bandwidth()`"""

        for ixc in range(0, 256):
            packet = bytes([ixc])
            bwx = ixc >> 4

            # Very cozy code from the test_opus_api.c
            _bwx = pylibopus.BANDWIDTH_NARROWBAND + (((((bwx & 7) * 9) & (63 - (bwx & 8))) + 2 + 12 * ((bwx & 8) != 0)) >> 4)  # NOQA pylint: disable=line-too-long

            self.assertEqual(
                _bwx, pylibopus.api.decoder.packet_get_bandwidth(packet)
            )

    def test_decode(self):
        """opus_decode()"""

        packet = bytes([255, 49])
        for _ in range(2, 51):
            packet += bytes([0])

        dec = pylibopus.api.decoder.create_state(48000, 2)
        try:
            pylibopus.api.decoder.decode(dec, packet, 51, 960, 0)
        except pylibopus.OpusError as exc:
            self.assertEqual(exc.code, pylibopus.INVALID_PACKET)

        packet = bytes([252, 0, 0])
        try:
            pylibopus.api.decoder.decode(dec, packet, -1, 960, 0)
        except pylibopus.OpusError as exc:
            self.assertEqual(exc.code, pylibopus.BAD_ARG)

        try:
            pylibopus.api.decoder.decode(dec, packet, 3, 60, 0)
        except pylibopus.OpusError as exc:
            self.assertEqual(exc.code, pylibopus.BUFFER_TOO_SMALL)

        try:
            pylibopus.api.decoder.decode(dec, packet, 3, 480, 0)
        except pylibopus.OpusError as exc:
            self.assertEqual(exc.code, pylibopus.BUFFER_TOO_SMALL)

        try:
            pylibopus.api.decoder.decode(dec, packet, 3, 960, 0)
        except pylibopus.OpusError:
            self.fail('Decode failed')

        pylibopus.api.decoder.destroy(dec)

    def test_decode_float(self):
        dec = pylibopus.api.decoder.create_state(48000, 2)

        packet = bytes([252, 0, 0])

        try:
            pylibopus.api.decoder.decode_float(dec, packet, 3, 960, 0)
        except pylibopus.OpusError:
            self.fail('Decode failed')

        pylibopus.api.decoder.destroy(dec)



================================================
FILE: tests/encoder.py
================================================
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# pylint: disable=missing-docstring
#

import ctypes  # type: ignore
import sys
import unittest

import pylibopus.api
import pylibopus.api.encoder
import pylibopus.api.ctl

__author__ = 'Никита Кузнецов <self@svartalf.info>'
__copyright__ = 'Copyright (c) 2012, SvartalF'
__license__ = 'BSD 3-Clause License'


class EncoderTest(unittest.TestCase):
    """Encoder basic API tests

    From the `tests/test_opus_api.c`
    """

    def _test_unsupported_sample_rates(self):
        for cxx in range(0, 4):
            for ixx in range(-7, 96000 + 1):

                if ixx in (8000, 12000, 16000, 24000, 48000) and cxx in (1, 2):
                    continue

                if ixx == -5:
                    fsx = -8000
                elif ixx == -6:
                    fsx = sys.maxsize  # TODO: Must be an INT32_MAX
                elif ixx == -7:
                    fsx = -1 * (sys.maxsize - 1)  # TODO: Must be an INT32_MIN
                else:
                    fsx = ixx

                try:
                    pylibopus.api.encoder.create_state(
                        fsx, cxx, pylibopus.APPLICATION_VOIP)
                except pylibopus.OpusError as exc:
                    self.assertEqual(exc.code, pylibopus.BAD_ARG)

    def test_create(self):
        try:
            pylibopus.api.encoder.create_state(48000, 2, pylibopus.AUTO)
        except pylibopus.OpusError as exc:
            self.assertEqual(exc.code, pylibopus.BAD_ARG)

        enc = pylibopus.api.encoder.create_state(
            48000, 2, pylibopus.APPLICATION_VOIP)
        pylibopus.api.encoder.destroy(enc)

        enc = pylibopus.api.encoder.create_state(
            48000, 2, pylibopus.APPLICATION_RESTRICTED_LOWDELAY)
        # TODO: rewrite that code
        # i = pylibopus.api.encoder.encoder_ctl(
        #     enc, pylibopus.api.ctl.get_lookahead)
        # if(err!=OPUS_OK || i<0 || i>32766)test_failed();
        pylibopus.api.encoder.destroy(enc)

        enc = pylibopus.api.encoder.create_state(
            48000, 2, pylibopus.APPLICATION_AUDIO)
        # TODO: rewrite that code
        # i = pylibopus.api.encoder.encoder_ctl(
        #     enc, pylibopus.api.ctl.get_lookahead)
        # err=opus_encoder_ctl(enc,OPUS_GET_LOOKAHEAD(&i));
        # if(err!=OPUS_OK || i<0 || i>32766)test_failed();
        pylibopus.api.encoder.destroy(enc)

    @classmethod
    def test_encode(cls):
        enc = pylibopus.api.encoder.create_state(
            48000, 2, pylibopus.APPLICATION_AUDIO)
        data = b'\x00' * ctypes.sizeof(ctypes.c_short) * 2 * 960
        pylibopus.api.encoder.encode(enc, data, 960, len(data))
        pylibopus.api.encoder.destroy(enc)

    @classmethod
    def test_encode_float(cls):
        enc = pylibopus.api.encoder.create_state(
            48000, 2, pylibopus.APPLICATION_AUDIO)
        data = b'\x00' * ctypes.sizeof(ctypes.c_float) * 2 * 960
        pylibopus.api.encoder.encode_float(enc, data, 960, len(data))
        pylibopus.api.encoder.destroy(enc)

    def test_unimplemented(self):
        enc = pylibopus.api.encoder.create_state(
            48000, 2, pylibopus.APPLICATION_AUDIO)
        try:
            pylibopus.api.encoder.encoder_ctl(enc, pylibopus.api.ctl.unimplemented)
        except pylibopus.OpusError as exc:
            self.assertEqual(exc.code, pylibopus.UNIMPLEMENTED)

        pylibopus.api.encoder.destroy(enc)

    def test_application(self):
        self.check_setget(
            pylibopus.api.ctl.set_application,
            pylibopus.api.ctl.get_application,
            (-1, pylibopus.AUTO),
            (pylibopus.APPLICATION_AUDIO,
             pylibopus.APPLICATION_RESTRICTED_LOWDELAY)
        )

    def test_bitrate(self):
        enc = pylibopus.api.encoder.create_state(
            48000, 2, pylibopus.APPLICATION_AUDIO)

        pylibopus.api.encoder.encoder_ctl(
            enc, pylibopus.api.ctl.set_bitrate, 1073741832)

        value = pylibopus.api.encoder.encoder_ctl(
            enc, pylibopus.api.ctl.get_bitrate)
        self.assertLess(value, 700000)
        self.assertGreater(value, 256000)

        pylibopus.api.encoder.destroy(enc)

        self.check_setget(
            pylibopus.api.ctl.set_bitrate,
            pylibopus.api.ctl.get_bitrate,
            (-12345, 0),
            (500, 256000)
        )

    def test_force_channels(self):
        self.check_setget(
            pylibopus.api.ctl.set_force_channels,
            pylibopus.api.ctl.get_force_channels,
            (-1, 3),
            (1, pylibopus.AUTO)
        )

    def test_bandwidth(self):
        enc = pylibopus.api.encoder.create_state(
            48000, 2, pylibopus.APPLICATION_AUDIO)

        # Set bandwidth
        ixx = -2
        self.assertRaises(
            pylibopus.OpusError,
            lambda: pylibopus.api.encoder.encoder_ctl(
                enc, pylibopus.api.ctl.set_bandwidth, ixx)
        )

        ix1 = pylibopus.BANDWIDTH_FULLBAND + 1
        self.assertRaises(
            pylibopus.OpusError,
            lambda: pylibopus.api.encoder.encoder_ctl(
                enc, pylibopus.api.ctl.set_bandwidth, ix1)
        )

        ix2 = pylibopus.BANDWIDTH_NARROWBAND
        pylibopus.api.encoder.encoder_ctl(
            enc, pylibopus.api.ctl.set_bandwidth, ix2)

        ix3 = pylibopus.BANDWIDTH_FULLBAND
        pylibopus.api.encoder.encoder_ctl(
            enc, pylibopus.api.ctl.set_bandwidth, ix3)

        ix4 = pylibopus.BANDWIDTH_WIDEBAND
        pylibopus.api.encoder.encoder_ctl(
            enc, pylibopus.api.ctl.set_bandwidth, ix4)

        ix5 = pylibopus.BANDWIDTH_MEDIUMBAND
        pylibopus.api.encoder.encoder_ctl(
            enc, pylibopus.api.ctl.set_bandwidth, ix5)

        # Get bandwidth
        value = pylibopus.api.encoder.encoder_ctl(
            enc, pylibopus.api.ctl.get_bandwidth)
        self.assertIn(
            value,
            (pylibopus.BANDWIDTH_FULLBAND,
             pylibopus.BANDWIDTH_MEDIUMBAND,
             pylibopus.BANDWIDTH_WIDEBAND,
             pylibopus.BANDWIDTH_NARROWBAND,
             pylibopus.AUTO)
        )

        pylibopus.api.encoder.encoder_ctl(
            enc, pylibopus.api.ctl.set_bandwidth, pylibopus.AUTO)

        pylibopus.api.encoder.destroy(enc)

    def test_max_bandwidth(self):
        enc = pylibopus.api.encoder.create_state(
            48000, 2, pylibopus.APPLICATION_AUDIO)

        i = -2
        self.assertRaises(
            pylibopus.OpusError,
            lambda: pylibopus.api.encoder.encoder_ctl(
                enc, pylibopus.api.ctl.set_max_bandwidth, i)
        )
        i = pylibopus.BANDWIDTH_FULLBAND + 1
        self.assertRaises(
            pylibopus.OpusError,
            lambda: pylibopus.api.encoder.encoder_ctl(
                enc, pylibopus.api.ctl.set_max_bandwidth, i)
        )
        i = pylibopus.BANDWIDTH_NARROWBAND
        pylibopus.api.encoder.encoder_ctl(
            enc, pylibopus.api.ctl.set_max_bandwidth, i)
        i = pylibopus.BANDWIDTH_FULLBAND
        pylibopus.api.encoder.encoder_ctl(
            enc, pylibopus.api.ctl.set_max_bandwidth, i)
        i = pylibopus.BANDWIDTH_WIDEBAND
        pylibopus.api.encoder.encoder_ctl(
            enc, pylibopus.api.ctl.set_max_bandwidth, i)
        i = pylibopus.BANDWIDTH_MEDIUMBAND
        pylibopus.api.encoder.encoder_ctl(
            enc, pylibopus.api.ctl.set_max_bandwidth, i)

        i = -12345
        value = pylibopus.api.encoder.encoder_ctl(
            enc, pylibopus.api.ctl.get_max_bandwidth)

        self.assertIn(
            value,
            (pylibopus.BANDWIDTH_FULLBAND,
             pylibopus.BANDWIDTH_MEDIUMBAND,
             pylibopus.BANDWIDTH_WIDEBAND,
             pylibopus.BANDWIDTH_NARROWBAND,
             pylibopus.AUTO)
        )

        pylibopus.api.encoder.destroy(enc)

    def test_dtx(self):
        self.check_setget(
            pylibopus.api.ctl.set_dtx, pylibopus.api.ctl.get_dtx, (-1, 2), (1, 0))

    def test_complexity(self):
        self.check_setget(
            pylibopus.api.ctl.set_complexity,
            pylibopus.api.ctl.get_complexity,
            (-1, 11),
            (0, 10)
        )

    def test_inband_fec(self):
        self.check_setget(
            pylibopus.api.ctl.set_inband_fec,
            pylibopus.api.ctl.get_inband_fec,
            (-1, 3),
            (1, 0)
        )

    def test_packet_loss_perc(self):
        self.check_setget(
            pylibopus.api.ctl.set_packet_loss_perc,
            pylibopus.api.ctl.get_packet_loss_perc,
            (-1, 101),
            (100, 0)
        )

    def test_vbr(self):
        self.check_setget(
            pylibopus.api.ctl.set_vbr, pylibopus.api.ctl.get_vbr, (-1, 2), (1, 0))

    def test_vbr_constraint(self):
        self.check_setget(
            pylibopus.api.ctl.set_vbr_constraint,
            pylibopus.api.ctl.get_vbr_constraint,
            (-1, 2),
            (1, 0)
        )

    def test_signal(self):
        self.check_setget(
            pylibopus.api.ctl.set_signal,
            pylibopus.api.ctl.get_signal,
            (-12345, 0x7FFFFFFF),
            (pylibopus.SIGNAL_MUSIC, pylibopus.AUTO)
        )

    def test_lsb_depth(self):
        self.check_setget(
            pylibopus.api.ctl.set_lsb_depth,
            pylibopus.api.ctl.get_lsb_depth,
            (7, 25),
            (16, 24)
        )

    def check_setget(self, v_set, v_get, bad, good):
        enc = pylibopus.api.encoder.create_state(
            48000, 2, pylibopus.APPLICATION_AUDIO)

        for value in bad:
            self.assertRaises(
                pylibopus.OpusError,
                lambda: pylibopus.api.encoder.encoder_ctl(enc, v_set, value)
            )

        for valuex in good:
            pylibopus.api.encoder.encoder_ctl(enc, v_set, valuex)
            result = pylibopus.api.encoder.encoder_ctl(enc, v_get)
            self.assertEqual(valuex, result)

        pylibopus.api.encoder.destroy(enc)



================================================
FILE: tests/hl_decoder.py
================================================
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# pylint: disable=missing-docstring
#

"""Tests for a high-level Decoder object"""

import unittest

import pylibopus

__author__ = 'Никита Кузнецов <self@svartalf.info>'
__copyright__ = 'Copyright (c) 2012, SvartalF'
__license__ = 'BSD 3-Clause License'


class DecoderTest(unittest.TestCase):

    def test_create(self):
        try:
            pylibopus.Decoder(1000, 3)
        except pylibopus.OpusError as ex:
            self.assertEqual(ex.code, pylibopus.BAD_ARG)

        pylibopus.Decoder(48000, 2)

    def test_get_bandwidth(self):
        decoder = pylibopus.Decoder(48000, 2)
        self.assertEqual(decoder.bandwidth, 0)

    def test_get_pitch(self):
        decoder = pylibopus.Decoder(48000, 2)

        self.assertIn(decoder.pitch, (-1, 0))

        packet = bytes([252, 0, 0])
        decoder.decode(packet, frame_size=960)
        self.assertIn(decoder.pitch, (-1, 0))

        packet = bytes([1, 0, 0])
        decoder.decode(packet, frame_size=960)
        self.assertIn(decoder.pitch, (-1, 0))

    def test_gain(self):
        decoder = pylibopus.Decoder(48000, 2)

        self.assertEqual(decoder.gain, 0)

        try:
            decoder.gain = -32769
        except pylibopus.OpusError as exc:
            self.assertEqual(exc.code, pylibopus.BAD_ARG)

        try:
            decoder.gain = 32768
        except pylibopus.OpusError as exc:
            self.assertEqual(exc.code, pylibopus.BAD_ARG)

        decoder.gain = -15
        self.assertEqual(decoder.gain, -15)

    @classmethod
    def test_reset_state(cls):
        decoder = pylibopus.Decoder(48000, 2)
        decoder.reset_state()

    def test_decode(self):
        decoder = pylibopus.Decoder(48000, 2)

        packet = bytes([255, 49])
        for _ in range(2, 51):
            packet += bytes([0])

        try:
            decoder.decode(packet, frame_size=960)
        except pylibopus.OpusError as exc:
            self.assertEqual(exc.code, pylibopus.INVALID_PACKET)

        packet = bytes([252, 0, 0])
        try:
            decoder.decode(packet, frame_size=60)
        except pylibopus.OpusError as exc:
            self.assertEqual(exc.code, pylibopus.BUFFER_TOO_SMALL)

        try:
            decoder.decode(packet, frame_size=480)
        except pylibopus.OpusError as exc:
            self.assertEqual(exc.code, pylibopus.BUFFER_TOO_SMALL)

        try:
            decoder.decode(packet, frame_size=960)
        except pylibopus.OpusError:
            self.fail('Decode failed')

    def test_decode_float(self):
        decoder = pylibopus.Decoder(48000, 2)
        packet = bytes([252, 0, 0])

        try:
            decoder.decode_float(packet, frame_size=960)
        except pylibopus.OpusError:
            self.fail('Decode failed')



================================================
FILE: tests/hl_encoder.py
================================================
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# pylint: disable=missing-docstring
#

"""Tests for a high-level Decoder object"""

import unittest

import pylibopus

__author__ = 'Никита Кузнецов <self@svartalf.info>'
__copyright__ = 'Copyright (c) 2012, SvartalF'
__license__ = 'BSD 3-Clause License'


class EncoderTest(unittest.TestCase):

    def test_create(self):
        try:
            pylibopus.Encoder(1000, 3, pylibopus.APPLICATION_AUDIO)
        except pylibopus.OpusError as ex:
            self.assertEqual(ex.code, pylibopus.BAD_ARG)

        pylibopus.Encoder(48000, 2, pylibopus.APPLICATION_AUDIO)

    @classmethod
    def test_reset_state(cls):
        encoder = pylibopus.Encoder(48000, 2, pylibopus.APPLICATION_AUDIO)
        encoder.reset_state()


