"""
Setup configuration for P/E Compression Analysis Skill.
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="pe-compression-analysis",
    version="0.1.0",
    author="Momentum Squared",
    author_email="",
    description="P/E Compression Analysis Skill with intelligent mode selection",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
    python_requires=">=3.10",
    install_requires=[
        "spacy>=3.7.0,<4.0.0",
        "pandas>=2.2.0,<3.0.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0,<8.0.0",
            "pytest-cov>=4.0.0,<5.0.0",
            "black>=23.0.0",
            "pylint>=2.17.0",
            "mypy>=1.0.0",
        ],
    },
)

